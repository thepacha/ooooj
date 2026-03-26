
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Play, Loader2, Languages, MessageSquare, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateArabicTTS } from '../services/geminiService';

const DIALECTS = [
  { id: 'msa', name: 'Modern Standard Arabic (Fusha)', description: 'Formal Arabic used in media and literature.' },
  { id: 'egyptian', name: 'Egyptian Arabic', description: 'Most widely understood dialect across the Arab world.' },
  { id: 'levantine', name: 'Levantine Arabic', description: 'Spoken in Syria, Lebanon, Jordan, and Palestine.' },
  { id: 'gulf', name: 'Gulf Arabic', description: 'Spoken in Saudi Arabia, UAE, Kuwait, Qatar, and Oman.' },
  { id: 'maghrebi', name: 'Maghrebi Arabic', description: 'Spoken in Morocco, Algeria, Tunisia, and Libya.' },
  { id: 'iraqi', name: 'Iraqi Arabic', description: 'Distinctive dialect spoken in Iraq.' },
  { id: 'sudanese', name: 'Sudanese Arabic', description: 'Spoken in Sudan and parts of Eritrea.' },
];

const VOICES = [
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Professional and clear' },
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Friendly and youthful' },
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Deep and authoritative' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Strong and resonant' },
  { id: 'Aoede', name: 'Aoede', gender: 'Female', description: 'Soft and expressive' },
];

export function GeminiArabicTTS() {
  const [text, setText] = useState('');
  const [selectedDialect, setSelectedDialect] = useState(DIALECTS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const playPcm = (base64Data: string, sampleRate: number = 24000) => {
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcmData = new Int16Array(bytes.buffer);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, pcmData.length, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (err) {
      console.error("Error playing audio:", err);
      setError("Failed to play audio. Your browser might not support the required audio format.");
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to generate speech.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const base64Audio = await generateArabicTTS(text, selectedDialect.name, selectedVoice.id);
      playPcm(base64Audio);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("TTS Generation Error:", err);
      setError(err.message || "An unexpected error occurred while generating speech.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0500e2]/10 dark:bg-[#4b53fa]/20 rounded-lg">
            <Languages className="text-[#0500e2] dark:text-[#4b53fa]" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gemini Arabic TTS</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
          Generate high-quality Arabic speech in any dialect using Gemini 2.5 Flash. 
          Perfect for localized customer support training and content creation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} />
              Dialect Selection
            </h3>
            <div className="space-y-2">
              {DIALECTS.map((dialect) => (
                <button
                  key={dialect.id}
                  onClick={() => setSelectedDialect(dialect)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedDialect.id === dialect.id
                      ? 'bg-[#0500e2]/5 border-[#0500e2] dark:border-[#4b53fa] dark:bg-[#4b53fa]/10'
                      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{dialect.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dialect.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Volume2 size={14} />
              Voice Profile
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedVoice.id === voice.id
                      ? 'bg-[#0500e2]/5 border-[#0500e2] dark:border-[#4b53fa] dark:bg-[#4b53fa]/10'
                      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{voice.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    voice.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                  }`}>
                    {voice.gender}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Input & Playback Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Text to Convert
                </label>
                <span className="text-xs text-gray-400">
                  {text.length} characters
                </span>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter Arabic text here... (e.g., كيف حالك اليوم؟)"
                dir="auto"
                className="w-full h-48 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-transparent outline-none transition-all resize-none text-lg leading-relaxed"
              />

              <div className="flex flex-col gap-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm"
                    >
                      <CheckCircle2 size={16} className="shrink-0" />
                      Speech generated and playing successfully!
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !text.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg ${
                    isLoading || !text.trim()
                      ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                      : 'bg-[#0500e2] hover:bg-[#0400c0] dark:bg-[#4b53fa] dark:hover:bg-[#3a42e0] shadow-[#0500e2]/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Generate & Play
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/30 p-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Gemini 2.5 Flash TTS
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  24kHz Sample Rate
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Dialect Adaptive
                </div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Info size={18} />
              Pro Tip for Dialects
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
              Gemini is highly capable of adapting text to specific dialects. You can enter text in Modern Standard Arabic and select a dialect, or enter the dialect text directly. For the best results, you can even include emotional cues like <span className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">"Say angrily:"</span> or <span className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">"Say with a smile:"</span> at the beginning of your text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Info = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
