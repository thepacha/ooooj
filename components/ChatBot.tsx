import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, Minimize2, AlertTriangle } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am RevuBot. How can I assist you with your QA tasks today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session once
    if (!chatRef.current) {
      try {
        chatRef.current = createChatSession();
      } catch (err: any) {
        console.error("Failed to initialize ChatBot:", err);
        setError("Chat unavailable: " + (err.message || "Unknown error"));
        setMessages(prev => [...prev, { role: 'model', text: "I'm currently unavailable due to a configuration issue (API Key missing)." }]);
      }
    }
  }, []);

  useEffect(() => {
    // Auto scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!chatRef.current) {
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        setTimeout(() => {
             setMessages(prev => [...prev, { role: 'model', text: "Chat is not initialized correctly. Please check API configuration." }]);
        }, 500);
        setInput('');
        return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const responseText = response.text;
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (error && !isOpen) {
      // Don't render the floating button if there's a critical init error, 
      // or maybe render it with an error state? 
      // Let's render it but show error on open.
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 no-print">
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[90vw] sm:w-96 flex flex-col overflow-hidden animate-fade-in transition-all origin-bottom-right h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-[#0500e2] p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">RevuBot Assistant</h3>
                <p className="text-xs text-blue-200">Powered by Gemini 3.0 Pro</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#0500e2] text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#0500e2] dark:text-[#4b53fa]" />
                  <span className="text-xs text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={error ? "Chat unavailable" : "Ask about QA or coaching..."}
                className="w-full pl-4 pr-12 py-3 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-[#0500e2] text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                disabled={isLoading || !!error}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !!error}
                className={`absolute right-1.5 p-2 rounded-full transition-all ${
                  !input.trim() || isLoading || !!error
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500' 
                    : 'bg-[#0500e2] text-white hover:bg-[#0400c0]'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-slate-800 dark:bg-slate-700 text-white' 
            : error 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#0500e2] hover:bg-[#0400c0] text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : error ? <AlertTriangle size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};