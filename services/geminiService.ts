import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Category } from '../types';

// Read API key from Vite environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini AI client
const ai = new GoogleGenAI({
  apiKey: apiKey
});

export const GeminiService = {

  /**
   * Generates financial insights based on expense history
   */
  generateInsights: async (expenses: Expense[], categories: Category[]): Promise<string> => {
    if (!apiKey) {
      return "API Key is missing. Please configure the environment variable.";
    }

    if (expenses.length === 0) {
      return "No expenses recorded yet. Add some transactions to get AI insights!";
    }

    // Prepare lightweight summary
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
   * Suggests a category based on an expense description
   */
  suggestCategory: async (description: string, categories: Category[]): Promise<string | null> => {
    if (!description || !apiKey) return null;

    const categoryList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');
    
    const prompt = `
      You are a smart financial assistant.
      Task: Categorize the expense description: "${description}".

      Available Categories:
      ${categoryList}

      Rules:
      1. Understand abbreviations (e.g., "med" -> Medicine/Health).
      2. Understand Indian context (e.g., "kirana" -> Groceries, "auto" -> Transport, "swiggy" -> Food).
      3. Return ONLY the JSON object with "categoryId". If no good match, return null.
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
   * Maps raw import categories to existing categories
   */
  mapImportCategories: async (rawCategories: string[], existingCategories: Category[]): Promise<Record<string, string>> => {
    if (rawCategories.length === 0 || !apiKey) return {};

    const existingList = existingCategories.map(c => `${c.name} (ID: ${c.id})`).join(', ');
    const rawList = JSON.stringify(rawCategories);

    const prompt = `
      You are an expert Transaction Classifier.
      Map Raw Transaction Strings to Existing App Category IDs.

      Existing App Categories:
      ${existingList}

      Raw Transaction Strings:
      ${rawList}
      
      Rules:
      1. Sub-string matching.
      2. Prefer existing categories.
      3. Map unclear cases to Others.
      4. Fixes: "med" -> Health, "food" -> Food, "kirana" -> Groceries, etc.

      Return a JSON object.
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
   * Extracts expenses from an uploaded image
   */
  parseExpenseImage: async (
    base64Image: string,
    categories: Category[]
  ): Promise<Array<{ description: string, amount: number, date: string, categoryId: string }>> => {
    if (!apiKey) return [];

    const categoryList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');

    const prompt = `
      Analyze this image and extract expenses.
      Return JSON array with: description, amount, date, categoryId.
      Use today's date if missing: ${new Date().toISOString().split('T')[0]}
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
            { text: prompt }
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
