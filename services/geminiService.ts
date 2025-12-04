import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Category } from '../types';

// Read API key from Vite environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini AI client
const ai = new GoogleGenAI({
  apiKey
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
      
      Provide a concise markdown summary including:
      - Spending patterns
      - One saving tip
      - A short budget suggestion
      Tone: Friendly and simple.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Could not generate insights at this time.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, an error occurred while generating insights.";
    }
  },

  /**
   * Suggests a category for a description
   */
  suggestCategory: async (description: string, categories: Category[]): Promise<string | null> => {
    if (!description || !apiKey) return null;

    const categoryList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');

    const prompt = `
      Categorize the expense description: "${description}".
      Categories: ${categoryList}

      Rules:
      - "med" → Health
      - "kirana" → Groceries
      - "auto" → Transport
      - "swiggy" / "food" → Food

      Return JSON: { "categoryId": "ID" }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categoryId: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result.categoryId || null;
    } catch (error) {
      console.error("AI Categorization Error:", error);
      return null;
    }
  },

  /**
   * Maps imported categories to existing categories
   */
  mapImportCategories: async (rawCategories: string[], existingCategories: Category[]): Promise<Record<string, string>> => {
    if (rawCategories.length === 0 || !apiKey) return {};

    const existingList = existingCategories.map(c => `${c.name} (ID: ${c.id})`).join(', ');
    const rawList = JSON.stringify(rawCategories);

    const prompt = `
      Map each Raw Transaction String to an Existing Category ID.
      Existing Categories: ${existingList}
      Raw Items: ${rawList}

      Rules:
      - Substring detection
      - Prefer existing categories
      - Unknown → Others
      - "med" → Health, "food" → Food, "kirana" → Groceries

      Return a JSON object mapping rawText → categoryId.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Mapping Error:", error);
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

    const prompt = `
      Analyze this image. Extract a list of expenses.
      Return JSON array:
      [
        {
          "description": "...",
          "amount": number,
          "date": "YYYY-MM-DD",
          "categoryId": "ID"
        }
      ]

      If date missing → use today: ${new Date().toISOString().split("T")[0]}.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",   // <-- correct model for image + text
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Image Analysis Error", error);
      return [];
    }
  }
};
