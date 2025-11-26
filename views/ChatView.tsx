import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingSource, UserProfile } from '../types';
import { sendFirstAidMessage } from '../services/geminiService';
import { getChatHistory, saveChatHistory } from '../services/dbService';
import { DEFAULT_SUGGESTIONS, t } from '../constants';
import ReactMarkdown from 'react-markdown';

// TypeScript definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface ChatViewProps {
  language?: string;
  user?: UserProfile;
}

const ChatView: React.FC<ChatViewProps> = ({ language = 'en-US', user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Speech State
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        const history = await getChatHistory(user.uid);
        setMessages(history);
      }
      setInitialLoad(false);
    };
    loadHistory();
  }, [user]);

  // Save history on changes
  useEffect(() => {
    if (!initialLoad && user && messages.length > 0) {
      saveChatHistory(user.uid, messages);
    }
  }, [messages, user, initialLoad]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    // Stop listening if active
    if (isListening) {
      stopListening();
    }
    
    // Stop speaking if active
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendFirstAidMessage(messages, text, language);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Speech to Text (Dictation) ---
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    // Initialize only if not already done or if we need a fresh instance
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
    }

    const recognition = recognitionRef.current;
    
    // Configure settings
    recognition.continuous = false; // Stop after one sentence for "Chat" style input
    recognition.interimResults = false; // Simple mode: only show final result
    recognition.lang = language; 

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      if (results && results[0] && results[0][0]) {
        const transcript = results[0][0].transcript;
        // Append to existing input
        setInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone access in your browser settings to use voice input.");
      }
      // 'no-speech' happens if user clicks mic but says nothing; just stop listening without alert
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // --- Text to Speech (Read Aloud) ---
  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      // Stop current
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    // Stop any previous
    window.speechSynthesis.cancel();

    // Clean text for better speech (remove markdown symbols)
    const cleanText = (text || '')
      .replace(/[*#_]/g, '') // remove markdown chars
      .replace(/\[.*?\]\(.*?\)/g, '') // remove links
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Set synthesis language
    utterance.lang = language;
    
    utterance.onend = () => {
      setSpeakingId(null);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const renderSources = (sources?: GroundingSource[]) => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-2">{t('sources', language)}</p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, idx) => (
            <a 
              key={idx}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-blue-600 text-xs px-2 py-1 rounded transition-colors"
            >
              <span className="material-symbols-rounded text-[10px]">
                {source.sourceType === 'map' ? 'map' : 'public'}
              </span>
              <span className="truncate max-w-[150px]">{source.title || 'Web Result'}</span>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70">
            <div className="bg-red-50 p-4 rounded-full">
              <span className="material-symbols-rounded text-4xl text-red-500">smart_toy</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-700">{t('firstAidTitle', language)}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                {t('firstAidDesc', language)}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="text-sm bg-white border border-gray-200 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm text-sm group
              ${msg.role === 'user' 
                ? 'bg-red-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}
            `}>
              {msg.role === 'model' ? (
                <>
                  <div className="markdown-body">
                     <div className="prose prose-sm max-w-none text-inherit prose-headings:font-bold prose-headings:text-gray-900 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                       <ReactMarkdown 
                         components={{
                           img: ({node, ...props}) => (
                             <div className="my-2 rounded-lg overflow-hidden border border-gray-200">
                               <img {...props} className="w-full h-auto object-cover" alt={props.alt || "First aid visual"} />
                             </div>
                           )
                         }}
                       >
                         {typeof msg.text === 'string' ? msg.text : String(msg.text)}
                       </ReactMarkdown>
                     </div>
                     {renderSources(msg.groundingSources)}
                  </div>
                  
                  {/* TTS Button for Model Messages */}
                  <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => handleSpeak(msg.text, msg.id)}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors
                        ${speakingId === msg.id 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
                      `}
                    >
                      <span className="material-symbols-rounded text-sm">
                        {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                      </span>
                      {speakingId === msg.id ? t('stop', language) : t('listen', language)}
                    </button>
                  </div>
                </>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm border border-gray-100 flex items-center gap-2">
               <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          {/* Speech to Text Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isListening 
                ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            <span className="material-symbols-rounded text-xl">
              {isListening ? 'stop_circle' : 'mic'}
            </span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : t('chatPlaceholder', language)}
            className={`flex-1 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
              isListening 
                ? 'bg-red-50 text-red-800 placeholder-red-400 border border-red-200' 
                : 'bg-gray-100 text-gray-800 focus:bg-white'
            }`}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-sm"
          >
            <span className="material-symbols-rounded text-xl">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;