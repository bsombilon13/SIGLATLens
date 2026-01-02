
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartCaption = async (imageDataUrl: string): Promise<string> => {
  try {
    const base64Data = imageDataUrl.split(',')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: "Suggest a single, short, witty, and fun caption for this photobooth photo. Keep it under 6 words. Just the text, no quotes." }
          ]
        }
      ],
      config: {
        temperature: 0.8,
        maxOutputTokens: 20
      }
    });

    return response.text || "Picture perfect! ✨";
  } catch (error) {
    console.error("Gemini caption error:", error);
    return "Looking good! ✨";
  }
};
