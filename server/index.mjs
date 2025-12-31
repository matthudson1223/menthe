import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env.local (or .env if it exists)
dotenv.config({ path: ".env.local" });
dotenv.config(); // Fallback to .env

const app = express();

// Configure CORS with environment-based origin restriction
const allowedOrigin = process.env.CLIENT_URL || process.env.VITE_CLIENT_URL;
app.use(
  cors({
    origin: allowedOrigin || (process.env.NODE_ENV === 'development' ? true : false),
    credentials: true,
  }),
);
app.use(express.json({ limit: "20mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!GEMINI_API_KEY) {
  // Fail fast on misconfiguration rather than 500s on every request
  // eslint-disable-next-line no-console
  console.error("Missing GEMINI_API_KEY environment variable");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const DEFAULT_SUMMARY_PROMPT = `Analyze the following content and provide a comprehensive summary.

The content consists of a transcript (from audio or image) and user-written notes. Combine insights from both sources.

TRANSCRIPT:
{{transcript}}

USER NOTES:
{{userNotes}}

Use markdown formatting (headers, bullet points, bold text) to organize the information clearly and make it easy to read.`;

const DEFAULT_TITLE_PROMPT = `Generate a short, concise title (max 6 words) for this note based on the content:

{{text}}`;

const DEFAULT_ACTION_ITEMS_PROMPT = `Identify and list key action items, to-dos, and next steps from the following text. Return them as a Markdown checklist.

{{text}}`;

const buildPromptForSummary = (transcript, userNotes, customPrompt = null) => {
  const template = customPrompt || DEFAULT_SUMMARY_PROMPT;
  return template
    .replace('{{transcript}}', transcript || "(No transcript provided)")
    .replace('{{userNotes}}', userNotes || "(No user notes provided)");
};

app.post("/api/gemini/transcribe-image", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body ?? {};
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "base64Image and mimeType are required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: "Transcribe the handwritten notes in this image verbatim. Do not summarize. Just provide the text exactly as it appears. If there are drawings, describe them in brackets [like this].",
          },
        ],
      },
    });

    res.json({ text: response.text || "" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Transcription error (image):", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body ?? {};
    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: "base64Audio and mimeType are required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe this audio recording verbatim. Ignore background noise. Format the output cleanly with appropriate line breaks and speaker separation if detected.",
          },
        ],
      },
    });

    res.json({ text: response.text || "" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Transcription error (audio):", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.post("/api/gemini/summary", async (req, res) => {
  try {
    const { transcript, userNotes, customPrompt } = req.body ?? {};

    const prompt = buildPromptForSummary(transcript ?? "", userNotes ?? "", customPrompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });

    res.json({ text: response.text || "" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Summarization error:", err);
    console.error("Error details:", {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      transcriptLength: req.body?.transcript?.length || 0,
      hasUserNotes: !!req.body?.userNotes
    });
    res.status(500).json({ error: "Summarization failed", details: err.message });
  }
});

app.post("/api/gemini/title", async (req, res) => {
  try {
    const { text, customPrompt } = req.body ?? {};
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const promptTemplate = customPrompt || DEFAULT_TITLE_PROMPT;
    const prompt = promptTemplate.replace('{{text}}', text.substring(0, 1000));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    res.json({ text: response.text?.trim() || "Untitled Note" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Titling error:", err);
    res.status(500).json({ error: "Title generation failed" });
  }
});

app.post("/api/gemini/actions", async (req, res) => {
  try {
    const { text, customPrompt } = req.body ?? {};
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const promptTemplate = customPrompt || DEFAULT_ACTION_ITEMS_PROMPT;
    const prompt = promptTemplate.replace('{{text}}', text);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    res.json({ actionItems: response.text?.trim() || "" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Action items extraction error:", err);
    res.status(500).json({ error: "Action items extraction failed" });
  }
});

app.post("/api/gemini/refine-summary", async (req, res) => {
  try {
    const { currentSummary, instruction } = req.body ?? {};
    if (!currentSummary || !instruction) {
      return res
        .status(400)
        .json({ error: "currentSummary and instruction are required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          {
            text: `You are an expert editor. 
          
          Current Summary:
          ${currentSummary}
          
          User Instruction:
          ${instruction}
          
          Please rewrite the summary incorporating the user's instruction. Maintain the original markdown formatting where appropriate.`,
          },
        ],
      },
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });

    res.json({ text: response.text || "" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Refinement error:", err);
    res.status(500).json({ error: "Refinement failed" });
  }
});

app.post("/api/gemini/tags", async (req, res) => {
  try {
    const { summary, title } = req.body ?? {};
    if (!summary) {
      return res.status(400).json({ error: "summary is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Extract 3-5 relevant tags from the following note. Tags should be single words or short phrases (1-2 words max), lowercase, and separated by commas. Be specific and meaningful.

          Title: ${title || "No title"}

          Content:
          ${summary.substring(0, 1000)}

          Return ONLY the tags as a comma-separated list, nothing else. Example: project planning, ai tools, productivity`,
          },
        ],
      },
    });

    const tagsText = response.text?.trim() || "";
    const tags =
      tagsText
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
        .slice(0, 10) ?? [];

    res.json({ tags });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Tag generation error:", err);
    res.status(500).json({ error: "Tag generation failed" });
  }
});

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message } = req.body ?? {};
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: message,
    });

    res.json({
      text: response.text || "I'm not sure how to respond to that.",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Gemini API server listening on port ${port}`);
});

