
import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Category } from '../types';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY
});

export const GeminiService = {
  /**
   * Generates financial insights based on expense history
   */
  generateInsights: async (expenses: Expense[], categories: Category[]): Promise<string> => {
    if (!process.env.API_KEY) {
      return "API Key is missing. Please configure the environment variable.";
    }

    if (expenses.length === 0) {
      return "No expenses recorded yet. Add some transactions to get AI insights!";
    }

    // Prepare a lightweight summary to avoid token limits
    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);

    const recentExpenses = expenses.slice(0, 50).map(e => ({
      amount: e.amount,
      category: categoryMap[e.categoryId] || 'Unknown',
      desc: e.description,
      date: e.date
    }));

    const prompt = `
      Analyze the following personal finance data.
      Total Spend: ${totalSpend}
      Recent Transactions: ${JSON.stringify(recentExpenses)}
      
      Please provide a concise financial insight summary in markdown format. 
      Include:
      1. Spending patterns (what they spend most on).
      2. One actionable tip to save money.
      3. A brief budget recommendation.
      
      Keep the tone friendly and encouraging.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Could not generate insights at this time.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, I encountered an error while analyzing your finances. Please try again later.";
    }
  },

  /**
   * Suggests a category based on the description using AI
   */
  suggestCategory: async (description: string, categories: Category[]): Promise<string | null> => {
    if (!description || !process.env.API_KEY) return null;

    const categoryList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');
    
    const prompt = `
      You are a smart financial assistant.
      Task: Categorize the expense description: "${description}".
      
      Available Categories:
      ${categoryList}
      
      Rules:
      1. Understand abbreviations (e.g., "med" -> Medicine/Health).
      2. Understand Indian context (e.g., "kirana" -> Groceries, "auto" -> Transport, "swiggy" -> Food).
      3. Return ONLY the JSON object with the "categoryId". If no good match, return null.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categoryId: { type: Type.STRING }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return result.categoryId || null;
    } catch (error) {
      console.error("AI Categorization Error", error);
      return null;
    }
  },

  /**
   * Maps a list of raw import categories to existing categories
   */
  mapImportCategories: async (rawCategories: string[], existingCategories: Category[]): Promise<Record<string, string>> => {
    if (rawCategories.length === 0 || !process.env.API_KEY) return {};

    const existingList = existingCategories.map(c => `${c.name} (ID: ${c.id})`).join(', ');
    const rawList = JSON.stringify(rawCategories);

    const prompt = `
      You are an expert Transaction Classifier.
      Task: Map the provided list of "Raw Transaction Strings" (which could be descriptions, vendor names, or categories) to the "Existing App Category IDs".

      Existing App Categories: 
      ${existingList}

      Raw Transaction Strings: 
      ${rawList}
      
      CLASSIFICATION RULES:
      1. **Sub-string Matching**: Look for keywords INSIDE the raw string.
         - "anv med", "cb med", "apollo pharmacy" -> Contains "med", "pharmacy" -> Map to 'Health' Category ID.
         - "dmart", "kirana store", "big basket" -> Map to 'Groceries' Category ID.
         - "starbucks", "mcdonalds", "swiggy" -> Map to 'Food' Category ID.
         - "uber", "ola", "shell fuel" -> Map to 'Transport' Category ID.
      
      2. **Prioritize Existing Categories**: Always try to find a fit in the Existing App Categories first. Only use "NEW" if it is a completely distinct concept (e.g., "Tuition Fees" when no Education category exists).
      
      3. **Ignore Junk**: If the string is generic like "UPI-123", "IMPS Transfer", "Debit Card", and you cannot determine the purpose, map it to 'Others' (find the ID for Others/General). Do NOT create a "NEW" category for generic banking terms.

      4. **Specific Fixes**:
         - Any string with "med" (anv med, cb med) MUST go to Health.
         - Any string with "food", "restaurant", "cafe" MUST go to Food.

      Output Format:
      Return a JSON object where keys are the Raw Transaction Strings (exactly as provided) and values are the **App Category ID** or "**NEW**".
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("AI Mapping Error", error);
      return {};
    }
  },

  /**
   * Analyzes an image of a receipt or handwritten notes
   */
  parseExpenseImage: async (base64Image: string, categories: Category[]): Promise<Array<{ description: string, amount: number, date: string, categoryId: string }>> => {
    if (!process.env.API_KEY) return [];

    const categoryList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');

    const prompt = `
      Analyze this image. It contains a list of expenses (handwritten or printed receipt).
      
      Your Goal: Extract each transaction.
      
      Available Categories:
      ${categoryList}

      Rules:
      1. Extract the **Description**, **Amount**, and **Date**.
      2. If date is missing, use today's date (${new Date().toISOString().split('T')[0]}).
      3. **Categorize**: Choose the best matching Category ID from the list above based on the description. 
         - If it looks like medicine/health, pick the Health ID.
         - If it looks like food/restaurant, pick the Food ID.
         - If uncertain, default to the 'Others' ID (or whichever ID represents General/Others).
      4. Ignore totals/subtotals lines.
      
      Output JSON Format:
      [
        {
          "description": "string",
          "amount": number,
          "date": "YYYY-MM-DD",
          "categoryId": "string (must be one of the provided IDs)"
        }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            },
            {
              text: prompt
            }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Image Analysis Error", error);
      return [];
    }
  }
};
