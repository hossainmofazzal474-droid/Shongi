import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, Trash2, Plus, Volume2, Copy, Check, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types for our notes
interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

// Color options for light mode
const COLORS_LIGHT = ['bg-[#f08080]', 'bg-[#add8e6]', 'bg-[#90ee90]']; // LightCoral, LightBlue, LightGreen
// Color options for dark mode
const COLORS_DARK = ['bg-[#cd5c5c]', 'bg-[#4682b4]', 'bg-[#2e8b57]']; // IndianRed, SteelBlue, SeaGreen

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'bn-BD'; // Bengali (Bangladesh)

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Load notes from local storage
    const savedNotes = localStorage.getItem('shongi_notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    // Load draft from local storage
    const savedDraft = localStorage.getItem('shongi_draft');
    if (savedDraft) {
      setTranscript(savedDraft);
    }

    // Load theme from local storage
    const savedTheme = localStorage.getItem('shongi_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const draftInterval = setInterval(() => {
      if (transcript.trim()) {
        localStorage.setItem('shongi_draft', transcript);
        console.log('Draft auto-saved');
      }
    }, 30000);

    return () => clearInterval(draftInterval);
  }, [transcript]);

  // Periodic auto-save for notes every 1 minute
  useEffect(() => {
    const notesInterval = setInterval(() => {
      localStorage.setItem('shongi_notes', JSON.stringify(notes));
      console.log('Notes periodic auto-save completed');
    }, 60000);

    return () => clearInterval(notesInterval);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('shongi_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('shongi_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const saveNote = () => {
    if (transcript.trim() === '') return;

    const colors = darkMode ? COLORS_DARK : COLORS_LIGHT;
    const newNote: Note = {
      id: Date.now().toString(),
      text: transcript.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
      timestamp: Date.now(),
    };

    setNotes([newNote, ...notes]);
    setTranscript('');
    localStorage.removeItem('shongi_draft');
  };

  const copyToClipboard = async () => {
    if (!transcript.trim()) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const clearTranscript = () => {
    setTranscript('');
    localStorage.removeItem('shongi_draft');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#121212] text-gray-100' : 'bg-[#f8f9fa] text-gray-900'} font-sans`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 shadow-sm border-b transition-colors duration-300 ${darkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Volume2 size={24} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight transition-colors ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>সঙ্গী (Shongi)</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-500 italic hidden sm:block">
              আপনার কথাকে লেখায় রূপান্তর করুন
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={darkMode ? "লাইট মোড" : "ডার্ক মোড"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Voice Input Section */}
        <section className={`rounded-3xl shadow-xl p-6 md:p-8 border transition-all duration-300 ${darkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <button
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isListening 
                    ? 'bg-red-500 animate-pulse scale-110' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
                } text-white`}
                title={isListening ? "রেকর্ডিং বন্ধ করুন" : "রেকর্ডিং শুরু করুন"}
              >
                {isListening ? <MicOff size={40} /> : <Mic size={40} />}
              </button>
              {isListening && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              )}
            </div>

            <div className="w-full min-h-[200px] relative group">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "শুনছি... কথা বলুন" : "এখানে লিখুন অথবা মাইক বাটনে ক্লিক করে কথা বলা শুরু করুন"}
                className={`w-full min-h-[200px] p-6 rounded-2xl border-2 border-dashed transition-all text-3xl md:text-4xl leading-relaxed font-medium resize-none focus:ring-0 focus:outline-none placeholder:text-xl placeholder:italic placeholder:font-normal ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-gray-700 text-gray-100 focus:border-emerald-500 placeholder:text-gray-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-emerald-400 placeholder:text-gray-400'
                }`}
              />
              {isListening && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  লাইভ
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 w-full justify-center">
              <button
                onClick={saveNote}
                disabled={!transcript.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"
              >
                <Save size={20} />
                সংরক্ষণ করুন
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!transcript.trim()}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 ${
                  isCopied 
                    ? 'bg-blue-600 text-white' 
                    : darkMode 
                      ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-30'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
                }`}
              >
                {isCopied ? <Check size={20} /> : <Copy size={20} />}
                {isCopied ? 'কপি হয়েছে' : 'কপি করুন'}
              </button>
              <button
                onClick={clearTranscript}
                disabled={!transcript.trim()}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95 ${
                  darkMode
                    ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-30'
                    : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
                }`}
              >
                <Trash2 size={20} />
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </section>

        {/* Saved Notes Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold flex items-center gap-2 transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <Plus size={20} className="text-emerald-600" />
              আপনার সংরক্ষিত নোটসমূহ
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              মোট: {notes.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className={`${note.color} p-6 rounded-2xl shadow-md border border-black/5 relative group hover:shadow-lg transition-all duration-300`}
                >
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(note.text);
                      }}
                      className="p-2 bg-white/50 hover:bg-white rounded-full text-blue-600 shadow-sm transition-colors"
                      title="কপি করুন"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 bg-white/50 hover:bg-white rounded-full text-red-500 shadow-sm transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className={`text-xl leading-snug mb-4 pr-16 transition-colors ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {note.text}
                  </p>
                  <div className={`text-[10px] uppercase tracking-wider font-bold opacity-60 transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
                    {new Date(note.timestamp).toLocaleString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {notes.length === 0 && (
            <div className={`text-center py-20 rounded-3xl border-2 border-dashed transition-colors ${darkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-gray-400 font-medium">এখনও কোনো নোট সংরক্ষিত নেই।</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} সঙ্গী - সহজ নোটবুক</p>
      </footer>
    </div>
  );
}
