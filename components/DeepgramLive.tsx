import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Play, Send, MessageSquare, Volume2, Radio } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { User } from '../types';

interface DeepgramLiveProps {
  user: User | null;
}

type Tab = 'transcription' | 'tts' | 'roleplay';

interface Scenario {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'angry-customer',
    name: 'Angry Customer',
    description: 'Product arrived damaged, and they have been on hold for 20 minutes.',
    systemPrompt: "You are an angry customer named Alex. Your expensive coffee machine arrived with a cracked water tank. You've been waiting on hold for 20 minutes and you're frustrated. You want a replacement sent overnight and some form of compensation for the wait. Be firm, slightly impatient, but don't use profanity. Your goal is to see how well the agent handles your frustration."
  },
  {
    id: 'confused-senior',
    name: 'Confused Senior',
    description: 'Struggling to find the login button and reset their password.',
    systemPrompt: "You are Margaret, a 75-year-old grandmother who is not very tech-savvy. You're trying to log in to see photos of your grandkids, but you can't find the 'Login' button and you think you forgot your password. You're very polite but easily confused by technical jargon like 'browser cache' or 'URL'. You need slow, step-by-step guidance."
  },
  {
    id: 'technical-pro',
    name: 'Technical Pro',
    description: 'Asking advanced questions about API integration and webhooks.',
    systemPrompt: "You are David, a senior software engineer. You're integrating the Revu API into your company's workflow. You have specific questions about webhook retry logic, rate limits (429 errors), and whether the transcript scoring supports custom weights via the API. You are professional, direct, and expect technical accuracy."
  },
  {
    id: 'refund-request',
    name: 'Refund Request',
    description: 'Forgot to cancel a subscription and wants a refund.',
    systemPrompt: "You are Sam. You noticed a $99 charge on your credit card for a subscription you meant to cancel three days ago. You're apologetic but firm that you haven't used the service this month and would like a full refund. You're a bit stressed about money right now."
  }
];

export const DeepgramLive: React.FC<DeepgramLiveProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('transcription');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('transcription')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'transcription'
              ? 'bg-[#0500e2] text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio size={18} />
          Live Transcription
        </button>
        <button
          onClick={() => setActiveTab('tts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'tts'
              ? 'bg-[#0500e2] text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Volume2 size={18} />
          Text to Voice
        </button>
        <button
          onClick={() => setActiveTab('roleplay')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'roleplay'
              ? 'bg-[#0500e2] text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={18} />
          AI Roleplay
        </button>
      </div>

      {activeTab === 'transcription' && <LiveTranscriptionTab />}
      {activeTab === 'tts' && <TextToVoiceTab />}
      {activeTab === 'roleplay' && <AIRoleplayTab />}
    </div>
  );
};

const LiveTranscriptionTab = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await fetch('/api/deepgram/token');
      const data = await response.json().catch(() => null);
      
      if (!response.ok || !data) {
        throw new Error(data?.error || 'Failed to get Deepgram token');
      }
      const { token } = data;
      if (!token) throw new Error('Received empty token from server');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const url = 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
      const socket = new WebSocket(url, ['token', token]);

      socket.onopen = () => {
        setIsConnecting(false);
        setIsRecording(true);
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const newTranscript = received.channel?.alternatives[0]?.transcript;
        if (newTranscript && received.is_final) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + newTranscript);
        }
      };

      socket.onerror = (err) => {
        console.error('Deepgram WebSocket error:', err);
        setError('Connection error occurred. Please check your API key and permissions.');
        stopRecording();
      };

      socket.onclose = () => {
        stopRecording();
      };

      socketRef.current = socket;

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      setIsConnecting(false);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    setIsRecording(false);
    setIsConnecting(false);
    mediaRecorderRef.current = null;
    streamRef.current = null;
    socketRef.current = null;
  };

  useEffect(() => {
    return () => stopRecording();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Live Transcription</h2>
            <p className="text-slate-500 dark:text-slate-400">Powered by Deepgram Nova-2</p>
          </div>

          {error && (
            <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isConnecting}
            className={`
              relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                : 'bg-[#0500e2] hover:bg-[#0400c0] shadow-[0_0_30px_rgba(5,0,226,0.3)]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isConnecting ? (
              <Loader2 size={32} className="text-white animate-spin" />
            ) : isRecording ? (
              <MicOff size={32} className="text-white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
            
            {isRecording && (
              <span className="absolute -inset-4 rounded-full border-2 border-red-500/30 animate-ping" />
            )}
          </button>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {isConnecting ? 'Connecting...' : isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm min-h-[300px] flex flex-col">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Transcript</h3>
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 overflow-y-auto">
          {transcript ? (
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 italic">
              Your transcript will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TextToVoiceTab = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chunkText = (text: string, maxLength: number = 2000): string[] => {
    const chunks: string[] = [];
    let currentText = text.trim();

    while (currentText.length > 0) {
      if (currentText.length <= maxLength) {
        chunks.push(currentText);
        break;
      }

      let splitIndex = currentText.lastIndexOf('. ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('? ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('! ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('\n', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf(' ', maxLength);
      
      if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
        splitIndex = maxLength;
      } else {
        splitIndex += 1; // Include the punctuation/space
      }

      chunks.push(currentText.substring(0, splitIndex).trim());
      currentText = currentText.substring(splitIndex).trim();
    }

    return chunks;
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      setError(null);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch('/api/deepgram/token');
      const data = await response.json().catch(() => null);
      
      if (!response.ok || !data) throw new Error(data?.error || 'Failed to get Deepgram token');
      const { token } = data;

      const chunks = chunkText(text);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const ttsResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: chunk })
        });

        if (!ttsResponse.ok) {
          const errData = await ttsResponse.json().catch(() => ({ error: 'Unknown TTS error' }));
          throw new Error(errData.error || `Failed to generate audio for chunk ${i+1}: ${ttsResponse.status}`);
        }

        const blob = await ttsResponse.blob();
        const url = URL.createObjectURL(blob);
        
        const audio = new Audio(url);
        audioRef.current = audio;
        
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          audio.play().catch(reject);
        });

        // Cleanup URL after playing
        URL.revokeObjectURL(url);
      }

      setIsSpeaking(false);
    } catch (err: any) {
      console.error('TTS Error:', err);
      setError(err.message || 'Failed to generate speech');
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Text to Voice</h2>
        <p className="text-slate-500 dark:text-slate-400">Powered by Deepgram Aura</p>
      </div>

      {error && (
        <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#0500e2] focus:border-transparent resize-none text-slate-900 dark:text-white"
          />
          <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-400">
            {text.length} characters
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSpeak}
            disabled={isSpeaking || !text.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
            {isSpeaking ? 'Speaking...' : 'Generate Voice'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AIRoleplayTab = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [transcript, setTranscript] = useState('');
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<{role: 'user' | 'ai', text: string}[]>([]);
  const isAiSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const fullTranscriptRef = useRef('');

  // Keep messagesRef in sync for the socket callback
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep isAiSpeakingRef and isProcessingRef in sync
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const chunkText = (text: string, maxLength: number = 2000): string[] => {
    const chunks: string[] = [];
    let currentText = text.trim();

    while (currentText.length > 0) {
      if (currentText.length <= maxLength) {
        chunks.push(currentText);
        break;
      }

      let splitIndex = currentText.lastIndexOf('. ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('? ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('! ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf('\n', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf(' ', maxLength);
      
      if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
        splitIndex = maxLength;
      } else {
        splitIndex += 1;
      }

      chunks.push(currentText.substring(0, splitIndex).trim());
      currentText = currentText.substring(splitIndex).trim();
    }

    return chunks;
  };

  const startSession = async () => {
    try {
      setError(null);
      setMessages([]);
      setTranscript('');
      accumulatedTranscriptRef.current = '';
      isAiSpeakingRef.current = false;
      isProcessingRef.current = false;
      
      const response = await fetch('/api/deepgram/token');
      const data = await response.json().catch(() => null);
      
      if (!response.ok || !data) throw new Error(data?.error || 'Failed to get Deepgram token');
      const { token } = data;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Use endpointing to detect when user stops speaking
      const url = 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&endpointing=500';
      const socket = new WebSocket(url, ['token', token]);

      socket.onopen = () => {
        setIsSessionActive(true);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          // Only send audio if AI isn't speaking and we aren't processing to avoid feedback/echo
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN && !isAiSpeakingRef.current && !isProcessingRef.current) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
      };

      socket.onmessage = async (message) => {
        const received = JSON.parse(message.data);
        const newTranscript = received.channel?.alternatives[0]?.transcript;
        
        if (!isAiSpeakingRef.current && !isProcessingRef.current) {
          if (newTranscript) {
            const currentFull = accumulatedTranscriptRef.current + (accumulatedTranscriptRef.current ? ' ' : '') + newTranscript;
            fullTranscriptRef.current = currentFull;
            
            // Only use is_final for the actual message to avoid duplicates
            if (received.is_final) {
              accumulatedTranscriptRef.current = currentFull;
              setTranscript(currentFull);
            } else {
              // Show interim results for better UX
              setTranscript(currentFull);
            }
          }
          
          // If Deepgram detects speech final (endpointing), trigger AI
          if (received.speech_final) {
            handleUserSpeechFinished();
          }
        }
      };

      socket.onerror = (err) => {
        console.error('Deepgram WebSocket error:', err);
        setError('Connection error occurred.');
        stopSession();
      };

      socketRef.current = socket;

    } catch (err: any) {
      console.error('Error starting session:', err);
      setError(err.message || 'Failed to start session');
      setIsSessionActive(false);
    }
  };

  const handleUserSpeechFinished = async () => {
    if (isProcessingRef.current || isAiSpeakingRef.current) return;

    const finalTranscript = fullTranscriptRef.current.trim();
    
    if (finalTranscript && finalTranscript.length > 0) {
      console.log('User speech finished, processing:', finalTranscript);
      // Immediately lock and clear
      setIsProcessing(true);
      isProcessingRef.current = true;
      accumulatedTranscriptRef.current = '';
      fullTranscriptRef.current = '';
      setTranscript('');
      
      processUserMessage(finalTranscript);
    } else {
      // Just clear if it was noise or empty
      accumulatedTranscriptRef.current = '';
      fullTranscriptRef.current = '';
      setTranscript('');
    }
  };

  const stopSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsSessionActive(false);
    setIsAiSpeaking(false);
    setIsProcessing(false);
    isAiSpeakingRef.current = false;
    isProcessingRef.current = false;
    accumulatedTranscriptRef.current = '';
    fullTranscriptRef.current = '';
    setTranscript('');
  };

  const processUserMessage = async (text: string) => {
    if (!isSessionActive) {
      setIsProcessing(false);
      isProcessingRef.current = false;
      return;
    }

    // Ensure we are in processing state
    setIsProcessing(true);
    isProcessingRef.current = true;

    // Ensure we have the latest messages
    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, { role: 'user' as const, text }];
    setMessages(newMessages);
    messagesRef.current = newMessages; // Immediate update

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured.');
      
      const ai = new GoogleGenAI({ apiKey });
      const contents = newMessages.map((msg: any) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: selectedScenario.systemPrompt + " Keep your responses very short and conversational (1-2 sentences max) to maintain a natural flow. You are speaking to a customer support agent.",
        },
      });
      
      const aiText = response.text;
      if (!aiText) throw new Error('Received empty response from AI');
      
      const updatedMessages = [...newMessages, { role: 'ai' as const, text: aiText }];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages; // Immediate update

      // Generate TTS for AI Response
      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;
      
      try {
        const tokenResponse = await fetch('/api/deepgram/token');
        const tokenData = await tokenResponse.json().catch(() => null);
        
        if (!tokenResponse.ok || !tokenData) throw new Error(tokenData?.error || 'Failed to get Deepgram token');
        const { token } = tokenData;

        const chunks = chunkText(aiText);
        
        for (let i = 0; i < chunks.length; i++) {
          if (!isSessionActive) break; // Stop if session ended
          
          const chunk = chunks[i];
          const ttsResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: chunk })
          });

          if (ttsResponse.ok) {
            const blob = await ttsResponse.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.warn('Audio playback timed out');
                resolve(null);
              }, 10000); // 10s safety timeout per chunk

              audio.onended = () => {
                clearTimeout(timeout);
                resolve(null);
              };
              audio.onerror = () => {
                clearTimeout(timeout);
                console.error('Audio playback error');
                resolve(null);
              };
              audio.play().catch((err) => {
                clearTimeout(timeout);
                console.error('Audio play catch:', err);
                resolve(null);
              });
            });
            URL.revokeObjectURL(url);
          }
        }
      } finally {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      }

    } catch (err: any) {
      console.error('Roleplay error:', err);
      setError(err.message || 'An error occurred during roleplay');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (socketRef.current) socketRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm flex flex-col h-[700px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Roleplay Session</h2>
          <p className="text-slate-500 dark:text-slate-400">Continuous voice training with specific scenarios</p>
        </div>
        
        {!isSessionActive && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  selectedScenario.id === s.id 
                    ? 'bg-white dark:bg-slate-700 text-[#0500e2] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
        {messages.length === 0 && !isSessionActive && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
            <div className="w-16 h-16 bg-[#0500e2]/10 rounded-full flex items-center justify-center text-[#0500e2]">
              <Radio size={32} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ready to practice?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select a scenario above and start a continuous voice session. The AI will respond automatically when you stop speaking.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-left border border-blue-100 dark:border-blue-800/30">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Current Scenario</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{selectedScenario.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{selectedScenario.description}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-[#0500e2] text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        
        {transcript && (
          <div className="flex justify-end opacity-50">
            <div className="max-w-[80%] p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tr-none italic text-xs">
              {transcript}...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 shrink-0">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 shrink-0">
        {!isSessionActive ? (
          <button
            onClick={startSession}
            className="flex items-center gap-3 px-8 py-4 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#0500e2]/20 scale-100 hover:scale-105 active:scale-95"
          >
            <Mic size={24} />
            Start Training Session
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Live Session</span>
            </div>
            
            <button
              onClick={stopSession}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:opacity-90"
            >
              <MicOff size={20} />
              End Session
            </button>
          </div>
        )}
      </div>
      
      {isSessionActive && (
        <p className="text-center text-xs text-slate-400 mt-4">
          {isAiSpeaking ? "AI is speaking..." : isProcessing ? "AI is thinking..." : "Listening for your voice..."}
        </p>
      )}
    </div>
  );
};
