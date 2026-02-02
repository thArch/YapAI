import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import OutputDisplay from './components/OutputDisplay';
import History from './components/History';
import { generateYap, transcribeAudio } from './services/gemini';
import { YapStyle, YapLength, HistoryItem } from './types';
import { Sparkles, Command, Zap, AlertCircle, Mic, Square, Loader2 } from 'lucide-react';

const DEFAULT_TOPIC = "Why cargo shorts are the peak of fashion";

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<YapStyle>(YapStyle.ZOOMER);
  const [length, setLength] = useState<YapLength>(YapLength.MEDIUM);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yap_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('yap_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic to yap about.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedContent('');

    try {
      const result = await generateYap(topic, style, length);
      setGeneratedContent(result);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        topic,
        content: result,
        style,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
    } catch (err) {
      setError("Failed to generate yap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('yap_history');
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setTopic(item.topic);
    setStyle(item.style);
    setGeneratedContent(item.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleGenerate();
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsTranscribing(true);
        try {
          const base64Audio = await blobToBase64(audioBlob);
          const text = await transcribeAudio(base64Audio, 'audio/webm');
          if (text) {
            setTopic(prev => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${text}` : text;
            });
          }
        } catch (err) {
          setError("Failed to transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data url prefix (e.g. "data:audio/webm;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 font-sans selection:bg-brand-500/30">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* LEFT COLUMN - CONTROLS */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500">Professional Yapping</span> instantly with YapAI.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                The advanced AI tool for creating nonsensical, lengthy, and highly specific monologues for any occasion.
              </p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl space-y-6">
              
              {/* Topic Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Topic</span>
                  <span className="text-xs text-zinc-500 font-normal">What are we yapping about?</span>
                </label>
                <div className="relative">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`e.g., ${DEFAULT_TOPIC}`}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none h-28 text-sm md:text-base"
                  />
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${
                      isRecording 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                    title="Dictate Topic"
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isRecording ? (
                      <Square className="w-5 h-5 fill-current" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Style Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Yap Style</label>
                <div className="relative">
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as YapStyle)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 pr-10 appearance-none text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm"
                  >
                    {Object.values(YapStyle).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Length Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Yap Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(YapLength).map((l) => {
                     const isSelected = length === l;
                     const label = l.split(' ')[0]; // Extract "Short", "Medium" etc.
                     return (
                        <button
                          key={l}
                          onClick={() => setLength(l)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            isSelected 
                              ? 'bg-brand-500/20 border-brand-500 text-brand-300' 
                              : 'bg-dark-bg border-dark-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {label}
                        </button>
                     );
                  })}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Zap className="w-5 h-5 animate-pulse" />
                    <span>Yapping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Generate Yap</span>
                  </>
                )}
              </button>
              
              <div className="text-center">
                 <span className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
                    <Command className="w-3 h-3" /> + Enter to generate
                 </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - OUTPUT */}
          <div className="lg:col-span-7">
             <OutputDisplay 
               content={generatedContent} 
               style={style} 
               isLoading={isLoading} 
               onRegenerate={handleGenerate}
             />
          </div>
        </div>

        <History items={history} onSelect={handleSelectHistory} onClear={handleClearHistory} />

      </main>
      
      <footer className="border-t border-dark-border mt-12 bg-dark-bg py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
           <p className="text-zinc-600 text-sm">
             © {new Date().getFullYear()} YapAI. Not affiliated with any real yappers.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;