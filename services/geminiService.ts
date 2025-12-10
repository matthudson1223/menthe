import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "../types";

// Vite inlines variables prefixed with VITE_ at build time; keep a Node fallback for tooling/tests.
const GEMINI_API_KEY =
  import.meta.env?.VITE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? process.env.API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to convert blob/file to base64
export const fileToBase64 = (file: globalThis.Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const transcribeImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Transcribe the handwritten notes in this image verbatim. Do not summarize. Just provide the text exactly as it appears. If there are drawings, describe them in brackets [like this].",
          },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe this audio recording verbatim. Ignore background noise. Format the output cleanly with appropriate line breaks and speaker separation if detected.",
          },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw error;
  }
};

export const generateSummary = async (transcript: string, userNotes: string = ""): Promise<string> => {
  try {
    // Using Pro with Thinking for deep analysis
    const prompt = `Analyze the following content and provide a comprehensive summary.
    
    The content consists of a verbatim transcript (from audio or image) and user-written notes. Combine insights from both sources.
    
    TRANSCRIPT:
    ${transcript || "(No transcript provided)"}
    
    USER NOTES:
    ${userNotes || "(No user notes provided)"}
    
    Use markdown formatting (headers, bullet points, bold text) to organize the information clearly and make it easy to read.`;

    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Summarization error:", error);
    throw error;
  }
};

export const generateTitle = async (text: string): Promise<string> => {
  try {
    // Use Flash Lite for fast low-latency response
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH_LITE,
      contents: {
        parts: [{ text: `Generate a short, concise title (max 6 words) for this note based on the content:\n\n${text.substring(0, 1000)}` }],
      },
    });
    return response.text?.trim() || "Untitled Note";
  } catch (error) {
    console.error("Titling error:", error);
    return "New Note";
  }
};

export const refineSummary = async (currentSummary: string, instruction: string): Promise<string> => {
  try {
    // Use Pro for complex edits/reasoning
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: {
        parts: [{
          text: `You are an expert editor. 
          
          Current Summary:
          ${currentSummary}
          
          User Instruction:
          ${instruction}
          
          Please rewrite the summary incorporating the user's instruction. Maintain the original markdown formatting where appropriate.`
        }],
      },
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Refinement error:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: message,
    });
    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
