import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
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

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error("RESEND_API_KEY is missing in process.env");
        return res.status(500).json({ error: "خطأ: لم يتم العثور على مفتاح RESEND_API_KEY. تأكد من كتابة الاسم صحيحاً في Secrets." });
      }

      const resendClient = new Resend(apiKey);
      console.log(`[CONTACT FORM] Attempting delivery to emadh5156@gmail.com...`);
      
      const { data, error } = await resendClient.emails.send({
        from: 'Dua App <onboarding@resend.dev>',
        to: ['emadh5156@gmail.com'],
        subject: 'رسالة جديدة من تطبيق دعاء للمتوفى',
        html: `<div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: #059669;">رسالة جديدة من الموقع</h2>
                <p><strong>من بريد:</strong> ${email}</p>
                <hr style="border: 1px solid #e5e7eb;" />
                <p><strong>الرسالة:</strong></p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">${message}</div>
               </div>`,
      });

      if (error) {
        console.error("Resend delivery error details:", {
          message: error.message,
          name: error.name,
          details: error
        });
        return res.status(400).json({ 
          error: `فشل الإرسال: ${error.message}`,
          tip: "إذا كنت تستخدم الحساب المجاني، يجب أن يكون البريد المستلم هو نفس بريد تسجيلك في Resend."
        });
      }
      
      console.log("[CONTACT FORM] Sent successfully:", data?.id);
      res.json({ success: true, message: "تم إرسال رسالتك بنجاح" });
    } catch (error: any) {
      console.error("Server contact error:", error);
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
