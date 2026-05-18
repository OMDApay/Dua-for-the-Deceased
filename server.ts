import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Global Gemini client helper
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Unified AI request handler
  const callGemini = async (prompt: string, model: string = "gemini-3-flash-preview") => {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    if (!response.text) throw new Error("No response from AI");
    return response.text;
  };

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      const prompt = `Translate the following Islamic Dua to ${targetLang}. Keep the spiritual and emotional tone: "${text}"`;
      const result = await callGemini(prompt);
      res.json({ text: result });
    } catch (error: any) {
      console.error("Translation Error:", error);
      res.status(500).json({ error: error.message === "GEMINI_API_KEY_MISSING" ? "مفتاح API غير متوفر في الإعدادات" : "فشل في الترجمة" });
    }
  });

  app.post("/api/diacritics", async (req, res) => {
    try {
      const { text } = req.body;
      const prompt = `Add full Arabic diacritics (Tashkeel) to: "${text}". Only return the diacritized text.`;
      const result = await callGemini(prompt);
      res.json({ text: result });
    } catch (error: any) {
      console.error("Diacritics Error:", error);
      res.status(500).json({ error: "فشل في إضافة التشكيل" });
    }
  });

  app.post("/api/generate-dua", async (req, res) => {
    try {
      const { text, kinship, language } = req.body;
      const prompt = `Act as an Islamic scholar. Create a beautiful Dua for the deceased: "${text}". Relation: ${kinship}. Language: ${language}.`;
      const result = await callGemini(prompt);
      res.json({ text: result });
    } catch (error: any) {
      console.error("Dua Gen Error:", error);
      res.status(500).json({ error: "فشل في توليد الدعاء" });
    }
  });

  app.post("/api/generate-audio", async (req, res) => {
    try {
      const { text, voiceType } = req.body;
      const ai = getGeminiClient();
      const voiceName = voiceType === 'child' ? 'Kore' : 'Puck';
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview", 
        contents: [{ role: 'user', parts: [{ text: `Recite this Islamic prayer in a beautiful, devotional way. Use the ${voiceType} voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        res.json({ audioData });
      } else {
        throw new Error("TTS_FAILED");
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: "فشل في توليد الصوت" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { email, message } = req.body;
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "مفتاح Resend غير متوفر" });

      const resendClient = new Resend(apiKey);
      await resendClient.emails.send({
        from: 'Dua App <onboarding@resend.dev>',
        to: [process.env.CONTACT_EMAIL || 'emadh5156@gmail.com'],
        subject: 'رسالة جديدة',
        html: `<p><strong>من:</strong> ${email}</p><p>${message}</p>`,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

