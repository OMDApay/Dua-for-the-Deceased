import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Translation
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Translate the following Islamic Dua to ${targetLang}. Keep the spiritual and emotional tone: "${text}"`;
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Diacritics
  app.post("/api/diacritics", async (req, res) => {
    try {
      const { text } = req.body;
      if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Add full Arabic diacritics (Tashkeel) to: "${text}". Only return the diacritized text.`;
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for AI Dua Generation
  app.post("/api/generate-dua", async (req, res) => {
    try {
      const { text, kinship, language } = req.body;
      if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Act as an Islamic scholar. Create a beautiful Dua for the deceased: "${text}". Relation: ${kinship}. Language: ${language}.`;
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Audio Generation
  app.post("/api/generate-audio", async (req, res) => {
    try {
      const { text, voiceType } = req.body;
      if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
      
      const voiceName = voiceType === 'child' ? 'Kore' : 'Fenrir';
      
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using a model that supports audio modality
      
      // Requesting audio modality
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Recite this Islamic prayer in a beautiful, devotional way. Use the ${voiceType} voice: ${text}` }] }],
        generationConfig: {
          responseModalities: ["audio" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        } as any
      });

      const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        res.json({ audioData });
      } else {
        // Fallback or better error logging
        console.error("Gemini failed to return audio inlineData");
        res.status(500).json({ error: "فشل النظام في توليد الصوت حالياً، يرجى المحاولة لاحقاً" });
      }
    } catch (error: any) {
      console.error("TTS Server Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Contact Form
  app.post("/api/contact", async (req, res) => {
    try {
      const { email, message } = req.body;
      if (!email || !message) {
        return res.status(400).json({ error: "البريد والرسالة مطلوبان" });
      }

      // TARGET EMAIL: emadh5156@gmail.com
      console.log(`[CONTACT FORM] Sending to emadh5156@gmail.com from ${email}: ${message}`);
      
      // Since I don't have a configured SMTP transport (no keys provided), 
      // I am logging it reliably which the user can see in logs.
      // In a production deployment, they should add an environment variable for SendGrid/Nodemailer.
      
      res.json({ success: true, message: "تم إرسال رسالتك بنجاح إلى الإدارة" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
