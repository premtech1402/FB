import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Category } from "../types";

// Read API key from Vite environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  /**
   * --------------------------------------------
   * 1. Generate AI Insights
   * --------------------------------------------
   */
  generateInsights: async (
    expenses: Expense[],
    categories: Category[]
  ): Promise<string> => {
    if (!apiKey) {
      return "API Key is missing. Please configure VITE_GEMINI_API_KEY.";
    }

    if (expenses.length === 0) {
      return "No expenses recorded yet. Add some transactions to get AI insights!";
    }

    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);

    const recentExpenses = expenses.slice(-20).map((e) => ({
      amount: e.amount,
      category: categoryMap[e.categoryId] || "Unknown",
      desc: e.description,
      date: e.date,
    }));

    const prompt = `
      Analyze the following personal finance data.
      Total Spend: ${totalSpend}
      Recent Transactions: ${JSON.stringify(recentExpenses)}

      Provide a concise markdown summary including:
      - Spending patterns
      - One saving tip
      - One budget suggestion
      Tone: Friendly and simple.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Could not generate insights.";
    } catch (err) {
      console.error("Gemini Error:", err);
      return "AI failed to generate insights.";
    }
  },

  /**
   * --------------------------------------------
   * 2. Auto-Suggest Category
   * --------------------------------------------
   */
  suggestCategory: async (
    description: string,
    categories: Category[]
  ): Promise<string | null> => {
    if (!description || !apiKey) return null;

    const categoryList = categories
      .map((c) => `${c.name} (ID: ${c.id})`)
      .join(", ");

    const prompt = `
      Categorize this expense: "${description}"
      Categories: ${categoryList}

      Return ONLY JSON: { "categoryId": "ID" }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { categoryId: { type: Type.STRING } },
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      return result.categoryId || null;
    } catch (err) {
      console.error("Category Suggestion Error:", err);
      return null;
    }
  },

  /**
   * --------------------------------------------
   * 3. Excel/CSV → Category Mapping
   * --------------------------------------------
   */
  mapImportCategories: async (
    rawCategories: string[],
    existingCategories: Category[]
  ): Promise<Record<string, string>> => {
    if (rawCategories.length === 0 || !apiKey) return {};

    const existingList = existingCategories
      .map((c) => `${c.name} (ID: ${c.id})`)
      .join(", ");

    const prompt = `
      Map each string to an existing category ID.
      Existing Categories: ${existingList}
      Raw Items: ${JSON.stringify(rawCategories)}

      Return JSON: { "rawText": "categoryId" }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      return JSON.parse(response.text || "{}");
    } catch (err) {
      console.error("Mapping Error:", err);
      return {};
    }
  },

  /**
   * --------------------------------------------
   * 4. Image → Expense Extraction (FINAL FIXED VERSION)
   * --------------------------------------------
   */
  parseExpenseImage: async (
    base64Image: string,
    categories: Category[],
    mimeType: string = "image/jpeg"
  ): Promise<
    Array<{
      description: string;
      amount: number;
      date: string;
      categoryId: string;
    }>
  > => {
    if (!apiKey) return [];

    const today = new Date().toISOString().split("T")[0];

    const prompt = `
      Extract expenses from the image.
      Return ONLY a JSON array:
      [
        {
          "description": "text",
          "amount": number,
          "date": "YYYY-MM-DD",
          "categoryId": "ID"
        }
      ]

      If date missing → use "${today}".
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro", // supports image + text
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      // Correct extraction from Gemini response
      const jsonText =
        response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

      return JSON.parse(jsonText);
    } catch (err) {
      console.error("Image AI Error:", err);
      return [];
    }
  },
};
