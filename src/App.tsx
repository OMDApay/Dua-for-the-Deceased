/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Languages, 
  Play, 
  Square, 
  Download, 
  Heart, 
  User, 
  Baby, 
  MessageSquare,
  Volume2,
  VolumeX,
  Sparkles,
  LogOut
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, loginWithGoogle, logout, handleRedirectResult } from './lib/firebase';
import { TRANSLATIONS, KINSHIP_OPTIONS, Language, VoiceType } from './types';

// Helper to add WAV header to raw PCM data
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  // write the PCM data
  const uint8Buffer = new Uint8Array(buffer);
  uint8Buffer.set(pcmData, 44);

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function App() {
  const [user] = useAuthState(auth);
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    handleRedirectResult();
  }, []);

  const [isDark, setIsDark] = useState(false);
  const [duaText, setDuaText] = useState('');
  const [kinship, setKinship] = useState('muslims');
  const [voiceType, setVoiceType] = useState<VoiceType>('man');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDiacritizing, setIsDiacritizing] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleTranslate = async () => {
    if (!duaText.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // If UI is Arabic, user likely wants English translation. If UI is English, they likely want Arabic.
      const targetLang = lang === 'ar' ? 'English' : 'Arabic';
      const prompt = `Translate the following Islamic Dua (prayer) to ${targetLang}. Ensure it is accurate, respectful, and maintains the spiritual meaning. Only return the translated text without any explanations, quotes, or extra text: "${duaText}"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const resultText = response.text;
      if (resultText) {
        setDuaText(resultText.trim());
      }
    } catch (error) {
      console.error("Translation Error:", error);
      alert(t.error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDiacritics = async () => {
    if (!duaText.trim()) return;
    setIsDiacritizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Add full Arabic diacritics (Tashkeel/Harakat) to the following text. Ensure it is grammatically correct and suitable for professional recitation. Only return the text with diacritics, no other text: "${duaText}"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setDuaText(response.text.trim());
      }
    } catch (error) {
      console.error("Diacritics Error:", error);
      alert(t.error);
    } finally {
      setIsDiacritizing(false);
    }
  };

  const handleAIGenerateDua = async () => {
    if (!duaText.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const selectedKinship = KINSHIP_OPTIONS.find(opt => opt.id === kinship);
      const kinshipLabel = selectedKinship?.id !== 'custom' ? selectedKinship?.label[lang] : '';
      
      const prompt = `Act as an Islamic scholar. Create a beautiful, emotional, and comprehensive Dua for the deceased based on this input: "${duaText}". 
      The person is my ${kinshipLabel}. 
      Include prayers for forgiveness, mercy, and paradise. 
      Mention the input name/relation at the beginning (e.g., "Allahummarham [Input]..." or "اللهم ارحم [الاسم/الصلة]..."). 
      Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
      Ensure the grammar is perfect. Only return the Dua text, no explanations or quotes.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const generatedDua = response.text?.trim();
      if (generatedDua) {
        setDuaText(generatedDua);
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(t.error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!duaText.trim()) return;
    
    if (!user) {
      const confirmed = confirm(t.loginToVoice);
      if (confirmed) {
        await loginWithGoogle();
      }
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Get the selected kinship option
      const selectedKinship = KINSHIP_OPTIONS.find(opt => opt.id === kinship);
      const kinshipLabel = selectedKinship ? selectedKinship.label[lang] : '';
      
      let fullDuaText = duaText;

      if (kinship !== 'custom') {
        // Smart adaptation: Use AI to adjust pronouns and gender based on kinship
        const adaptationPrompt = `Rewrite the following Islamic Dua (prayer) to be specifically for "${kinshipLabel}". 
        Adjust all pronouns and gender-specific words to match (e.g., in Arabic change 'له' to 'لها' if female, or 'him' to 'her' in English). 
        Ensure the grammar is perfect and respectful. 
        Only return the adapted text without any quotes or extra words: "${duaText}"`;

        const adaptationResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: adaptationPrompt }] }],
        });

        const adaptedText = adaptationResponse.text?.trim() || duaText;
        
        // Prepend the kinship prefix if not already included by the AI
        const prefix = selectedKinship ? selectedKinship.prefix[lang] : '';
        // Check if the adapted text already starts with a similar invocation to avoid redundancy
        fullDuaText = adaptedText.includes(prefix.trim()) ? adaptedText : `${prefix}${adaptedText}`;
      }

      // Map voice types to Gemini prebuilt voices
      // Kore/Puck for child-like, Fenrir/Charon for man-like
      const voiceName = voiceType === 'child' ? 'Kore' : 'Fenrir';
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: fullDuaText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        // Add WAV header to make it playable by standard players
        const blob = pcmToWav(byteArray, 24000);
        const url = URL.createObjectURL(blob);
        
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setIsPlaying(true);
            }).catch(e => {
              console.error("Playback failed:", e);
              setIsPlaying(false);
            });
          }
        }
      }
    } catch (error) {
      console.error("TTS Error:", error);
      alert(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `dua_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`min-h-screen font-sans ${isRtl ? 'font-arabic' : ''} islamic-pattern bg-fixed`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Controls */}
      <header className="p-4 flex justify-between items-center max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full islamic-gradient flex items-center justify-center shadow-lg">
            <Heart className="text-amber-400 w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold gold-text hidden sm:block">{t.title}</h1>
        </motion.div>

        <div className="flex gap-2 items-center">
          {user ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 sm:gap-2 bg-emerald-50 dark:bg-emerald-950/30 p-1 pr-3 rounded-full border border-emerald-100 dark:border-emerald-800"
            >
              <span className="text-[10px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400 hidden sm:inline">
                {user.displayName?.split(' ')[0]}
              </span>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-600 transition-colors"
                title={t.logoutBtn}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loginWithGoogle()}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-medium shadow-md shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">{t.loginBtn}</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="p-2 rounded-full glass-card flex items-center gap-2 px-4 text-sm font-medium"
          >
            <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {lang === 'ar' ? 'English' : 'العربية'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full glass-card"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-emerald-700" />}
          </motion.button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-emerald-900 dark:text-emerald-100">
            {t.title}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-lg italic">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="grid gap-8">
          {/* Input 1: Dua Text */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <MessageSquare className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t.duaPlaceholder}
              </label>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAIGenerateDua}
                  disabled={isAiGenerating || !duaText.trim()}
                  className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 disabled:opacity-50"
                  title={t.aiGenerateBtn}
                >
                  {isAiGenerating ? (
                    <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {t.aiGenerateBtn}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDiacritics}
                  disabled={isDiacritizing || !duaText.trim() || lang !== 'ar'}
                  className={`text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1 disabled:opacity-50 ${lang !== 'ar' ? 'hidden' : ''}`}
                >
                  {isDiacritizing ? (
                    <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {t.diacriticsBtn}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTranslate}
                  disabled={isTranslating || !duaText.trim()}
                  className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 disabled:opacity-50"
                >
                  {isTranslating ? (
                    <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  {t.translateBtn}
                </motion.button>
              </div>
            </div>
            <textarea
              value={duaText}
              onChange={(e) => setDuaText(e.target.value)}
              className="w-full h-40 p-4 rounded-2xl bg-stone-50/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
              placeholder={t.duaPlaceholder}
            />
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Input 2: Kinship */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-3xl"
            >
              <label className="block text-sm font-bold mb-3 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t.kinshipLabel}
              </label>
              <select
                value={kinship}
                onChange={(e) => setKinship(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-50/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-stone-900 dark:text-stone-100"
              >
                {KINSHIP_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label[lang]}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Input 3: Voice Type */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-3xl"
            >
              <label className="block text-sm font-bold mb-3 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                {t.voiceLabel}
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setVoiceType('child')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    voiceType === 'child' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Baby className={`w-5 h-5 ${voiceType === 'child' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-500'}`} />
                  {t.voiceChild}
                </button>
                <button
                  onClick={() => setVoiceType('man')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    voiceType === 'man' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <User className={`w-5 h-5 ${voiceType === 'man' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-500'}`} />
                  {t.voiceMan}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateAudio}
              disabled={isLoading || !duaText.trim()}
              className={`w-full sm:w-auto px-12 py-4 rounded-2xl islamic-gradient text-white font-bold text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-6 h-6 fill-current" />
              )}
              {t.generateBtn}
            </motion.button>

            <AnimatePresence>
              {audioUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-4 w-full sm:w-auto"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStop}
                    className="flex-1 sm:flex-none p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span className="sm:hidden">{t.stopBtn}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span className="sm:hidden">{t.downloadBtn}</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Visualizer Animation when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12 flex justify-center items-end gap-1 h-12"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [10, 40, 20, 48, 15],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.5 + Math.random() * 0.5,
                    delay: i * 0.05
                  }}
                  className="w-2 bg-emerald-500 rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 p-8 text-center text-stone-500 dark:text-stone-500 text-sm">
        <p>© {new Date().getFullYear()} {t.title} - {t.subtitle}</p>
      </footer>
    </div>
  );
}
