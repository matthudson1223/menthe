import { GeminiModel } from "../types";

const normalizeBaseUrl = (base: string | undefined): string => {
  const trimmed = (base || "").replace(/\/+$/, "");
  if (!trimmed) {
    console.warn("VITE_API_BASE_URL is not set; defaulting to http://localhost:8080");
    return "http://localhost:8080";
  }
  return trimmed;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

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
    const response = await fetch(buildUrl("/api/gemini/transcribe-image"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, mimeType }),
    });
    if (!response.ok) {
      throw new Error("Transcription failed");
    }
    const data = await response.json();
    return data.text ?? "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/transcribe-audio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Audio, mimeType }),
    });
    if (!response.ok) {
      throw new Error("Audio transcription failed");
    }
    const data = await response.json();
    return data.text ?? "";
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw error;
  }
};

export const generateSummary = async (
  transcript: string,
  userNotes: string = "",
  customPrompt?: string
): Promise<string> => {
  try {
    // Using Pro with Thinking for deep analysis
    const response = await fetch(buildUrl("/api/gemini/summary"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, userNotes, customPrompt }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = `Summarization failed: ${response.status} ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`;
      console.error(errorMessage, errorData);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data.text ?? "";
  } catch (error) {
    console.error("Summarization error:", error);
    throw error;
  }
};

export const generateTitle = async (text: string, customPrompt?: string): Promise<string> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/title"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, customPrompt }),
    });
    if (!response.ok) {
      throw new Error("Title generation failed");
    }
    const data = await response.json();
    return (data.text as string | undefined)?.trim() || "Untitled Note";
  } catch (error) {
    console.error("Titling error:", error);
    return "New Note";
  }
};

export const refineSummary = async (currentSummary: string, instruction: string): Promise<string> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/refine-summary"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSummary, instruction }),
    });
    if (!response.ok) {
      throw new Error("Refinement failed");
    }
    const data = await response.json();
    return data.text ?? "";
  } catch (error) {
    console.error("Refinement error:", error);
    throw error;
  }
};

export const generateActionItems = async (text: string, customPrompt?: string): Promise<string> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/actions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, customPrompt }),
    });
    if (!response.ok) {
      throw new Error("Action items extraction failed");
    }
    const data = await response.json();
    return data.actionItems ?? "";
  } catch (error) {
    console.error("Action items extraction error:", error);
    throw error;
  }
};

export const generateTags = async (summary: string, title: string = ""): Promise<string[]> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/tags"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, title }),
    });
    if (!response.ok) {
      throw new Error("Tag generation failed");
    }
    const data = await response.json();
    return (data.tags as string[] | undefined) ?? [];
  } catch (error) {
    console.error("Tag generation error:", error);
    return [];
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    const response = await fetch(buildUrl("/api/gemini/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error("Chat failed");
    }
    const data = await response.json();
    return data.text ?? "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
