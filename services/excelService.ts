
import * as XLSX from 'xlsx';
import { Expense, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { KEYWORD_RULES } from '../constants';
import { GeminiService } from './geminiService';

interface ParsedRow {
  [key: string]: any;
}

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

const generateRandomColor = () => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', 
    '#F43F5E', '#64748B'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const ExcelService = {
  parseFile: async (file: File, existingCategories: Category[]): Promise<{ expenses: Expense[], newCategories: Category[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData: ParsedRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (rawData.length === 0) {
            return resolve({ expenses: [], newCategories: [] });
          }

          const newExpenses: Expense[] = [];
          const newCategoriesCreatedMap = new Map<string, Category>(); // lowerName -> Category
          
          // 1. Identify Headers & Mode
          const headers = Object.keys(rawData[0]);
          const amountKey = headers.find(h => /^(amount|amt|price|cost|debit|spending|value)$/i.test(h));
          const dateKey = headers.find(h => /^(date|dt|when|day)$/i.test(h));
          const isMatrixMode = !!dateKey && !amountKey && headers.length > 2;

          // 2. Extract Unique Raw Categories (or Descriptions acting as Categories)
          let rawCategoriesSet = new Set<string>();
          let usedSourceType: 'explicit_category' | 'description' | 'matrix' = 'explicit_category';

          if (isMatrixMode) {
             usedSourceType = 'matrix';
             const ignoredHeaders = ['total', 'final', 'subtotal', 'sum', 'notes', 'comments', 'description', String(dateKey).toLowerCase()];
             headers.forEach(h => {
               const lowerH = h.toLowerCase().trim();
               if (lowerH && !ignoredHeaders.includes(lowerH) && !lowerH.includes('total')) {
                 rawCategoriesSet.add(h.trim());
               }
             });
          } else {
             // List Mode: First try to find a Category column
             rawData.forEach(row => {
               const val = getVal(row, ['category', 'cat', 'type', 'expense type']);
               if (val) rawCategoriesSet.add(String(val).trim());
             });

             // INTELLIGENT SOURCE DETECTION
             // Often "Category" columns in bank exports contain useless generic info like "UPI", "Debit", "Transfer".
             // We check the quality of the extracted categories.
             const genericTerms = new Set(['debit', 'credit', 'dr', 'cr', 'withdrawal', 'deposit', 'transfer', 'upi', 'pos', 'atm', 'card', 'imps', 'neft', 'rtgs', 'mbk', 'mobile', 'net', 'banking', 'txn', 'transaction', 'expense', 'payment']);
             
             let shouldUseDescription = false;
             
             // If NO category column found
             if (rawCategoriesSet.size === 0) {
               shouldUseDescription = true;
             } 
             else {
                // Check if the categories are mostly generic junk
                const uniqueItems = Array.from(rawCategoriesSet);
                const totalItems = uniqueItems.length;
                const genericCount = uniqueItems.filter(i => genericTerms.has(i.toLowerCase())).length;
                
                // If more than 50% are generic terms, OR if total unique categories are very low (< 3) but rows are many, prefer description
                if ((genericCount / totalItems > 0.5) || (totalItems < 3 && rawData.length > 5)) {
                   shouldUseDescription = true;
                }
             }

             if (shouldUseDescription) {
               usedSourceType = 'description';
               rawCategoriesSet.clear(); // Clear poor quality categories
               rawData.forEach(row => {
                 const val = getVal(row, ['description', 'desc', 'details', 'particulars', 'narration']);
                 if (val) rawCategoriesSet.add(String(val).trim());
               });
             }
          }

          const uniqueRawCategories = Array.from(rawCategoriesSet).filter(s => s && s.length > 1);

          // 3. AI Mapping Step
          let aiMapping: Record<string, string> = {};
          try {
            if (uniqueRawCategories.length > 0) {
                // Increased batch size to 1000 for Gemini Flash (large context window)
                const batch = uniqueRawCategories.slice(0, 1000); 
                aiMapping = await GeminiService.mapImportCategories(batch, existingCategories);
            }
          } catch (err) {
            console.warn("AI mapping failed, falling back to manual creation", err);
          }

          // Helper to resolve category ID based on AI mapping or rules
          const resolveCategory = (rawInput: string): { id: string, originalName?: string, isNew?: boolean } => {
            const cleanRaw = rawInput.trim();
            const lowerRaw = cleanRaw.toLowerCase();
            
            // Priority 1: Check AI Mapping
            // AI might return keys in slightly different case, so check both
            const mappedId = aiMapping[cleanRaw] || aiMapping[lowerRaw] || aiMapping[rawInput];
            
            // Case 1A: AI mapped to an EXISTING category ID
            if (mappedId && mappedId !== "NEW") {
              if (existingCategories.find(c => c.id === mappedId)) {
                return { id: mappedId, originalName: cleanRaw, isNew: false };
              }
            }

            // Case 1B: AI explicitly said "NEW" or no mapping found
            
            // Priority 2: Check if we've already created this NEW category in this session
            if (newCategoriesCreatedMap.has(lowerRaw)) {
              return { id: newCategoriesCreatedMap.get(lowerRaw)!.id, isNew: true };
            }

            // Priority 3: Check strict name match against existing categories (Fallback)
            const strictMatch = existingCategories.find(c => c.name.toLowerCase() === lowerRaw);
            if (strictMatch) {
                return { id: strictMatch.id, isNew: false };
            }

            // Priority 4: Create a Brand NEW Category
            const newCat: Category = {
              id: uuidv4(),
              name: toTitleCase(cleanRaw) || 'Imported Misc',
              color: generateRandomColor(),
              isCustom: true
            };
            newCategoriesCreatedMap.set(lowerRaw, newCat);
            return { id: newCat.id, isNew: true };
          };

          // 4. Process Rows
          if (isMatrixMode) {
            rawData.forEach((row) => {
              const dateVal = row[dateKey!];
              if (!dateVal) return;
              const strDateVal = String(dateVal).toLowerCase();
              if (strDateVal.includes('total') || strDateVal.includes('final')) return;
              
              const dateStr = parseDate(dateVal);

              uniqueRawCategories.forEach(rawCatHeader => {
                 const val = row[rawCatHeader];
                 const amount = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
                 
                 if (!isNaN(amount) && amount > 0) {
                    const result = resolveCategory(rawCatHeader);
                    
                    // Logic: Append original header to description if mapped to a different name
                    let desc = `${toTitleCase(rawCatHeader)} Expense`;
                    
                    if (!result.isNew && result.originalName) {
                       const mappedCatName = existingCategories.find(c => c.id === result.id)?.name;
                       if (mappedCatName && mappedCatName.toLowerCase() !== rawCatHeader.toLowerCase()) {
                         desc = `${mappedCatName} Expense (${rawCatHeader})`;
                       }
                    }

                    newExpenses.push({
                      id: uuidv4(),
                      amount,
                      description: desc,
                      categoryId: result.id,
                      date: dateStr,
                      notes: 'Imported via Matrix'
                    });
                 }
              });
            });
          } else {
             // List Mode
             rawData.forEach((row) => {
              let description = getVal(row, ['description', 'desc', 'details', 'particulars', 'narration']) || 'Imported Expense';
              let amountStr = getVal(row, ['amount', 'amt', 'cost', 'price', 'debit', 'spending', 'value']);
              
              if (amountStr === null || amountStr === undefined || amountStr === '') return;

              let amount = parseFloat(amountStr);
              if (isNaN(amount)) return;
              amount = Math.abs(amount);
              if (amount === 0) return;

              let dateVal = getVal(row, ['date', 'dt', 'time', 'when']);
              let dateStr = parseDate(dateVal);

              // Determine categorization source for THIS row
              let rawInputForCategory = '';
              let isImplicitCategory = false;

              if (usedSourceType === 'explicit_category') {
                rawInputForCategory = getVal(row, ['category', 'cat', 'type', 'expense type']);
              } else {
                // Using description as category source
                rawInputForCategory = description;
                isImplicitCategory = true;
              }
              
              let categoryId = '';
              
              if (rawInputForCategory) {
                const result = resolveCategory(String(rawInputForCategory));
                categoryId = result.id;

                // Update description logic:
                // If we used an explicit category column (e.g., 'anv med') and it mapped to 'Health',
                // we want the description to become: "Original Description (anv med)".
                
                // If we used the description itself (e.g. 'anv med') and it mapped to 'Health',
                // the description remains 'anv med' (we don't append it to itself).
                
                if (!isImplicitCategory && !result.isNew && result.originalName) {
                     const mappedCatName = existingCategories.find(c => c.id === categoryId)?.name;
                     // Avoid redundancy if description already contains the category text
                     if (mappedCatName && !description.toString().toLowerCase().includes(rawInputForCategory.toString().toLowerCase())) {
                        description = `${description} (${rawInputForCategory})`;
                     }
                }
              } else {
                 // Fallback if somehow empty
                 const others = existingCategories.find(c => c.name === 'Others');
                 categoryId = others ? others.id : (resolveCategory('Others').id);
              }

              newExpenses.push({
                 id: uuidv4(),
                 amount,
                 description: String(description),
                 categoryId,
                 date: dateStr,
                 notes: getVal(row, ['notes', 'remarks', 'comment']) || ''
               });
            });
          }

          resolve({
            expenses: newExpenses,
            newCategories: Array.from(newCategoriesCreatedMap.values())
          });
          
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
};

// Helpers
function getVal(row: any, keys: string[]) {
  for (const key of keys) {
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey) return row[foundKey];
  }
  return null;
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'string' && /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(val)) {
      const parts = val.split(/[-/]/).map(Number);
      const day = parts[0];
      const month = parts[1] - 1;
      const year = parts[2];
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().split('T')[0];
      }
  }
  if (val instanceof Date) {
    const offset = val.getTimezoneOffset() * 60000;
    const localDate = new Date(val.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}
