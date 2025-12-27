
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ description: string; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('eman_ai_describer_apikey');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('eman_ai_describer_apikey', key);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!apiKey.trim()) {
      alert("Please enter your Gemini API Key first!");
      return;
    }
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: `Analyze this image in extreme detail. 
                1. Provide a comprehensive description in Arabic.
                2. Formulate a professional image generation prompt in English for tools like Midjourney or DALL-E.
                
                Respond ONLY in JSON format:
                {
                  "description": "Arabic text here",
                  "prompt": "English text here"
                }`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (text) {
        const parsedResult = JSON.parse(text);
        setResult(parsedResult);
      } else {
        throw new Error("No response received from the model.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('403') || err.message?.includes('API_KEY_INVALID')) {
        setError("Invalid API Key. Please check your key and try again.");
      } else {
        setError("An error occurred during analysis. Please ensure your API Key is valid and you have quota.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-purple-100">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-1 text-lg"></i>
              <p className="text-blue-800 text-sm md:text-base leading-relaxed">
                <span className="font-bold">Note:</span> This tool works with <span className="underline">YOUR API Key</span>. 
                Get your free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-600 transition-colors">aistudio.google.com/apikey</a> 
                - Each user uses their own Gmail account and API quota, not mine.
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] mb-3">
              AI Image Describer - Eman Mohamed
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Smart tool for automatic image description using Gemini AI. Use your own API Key to get accurate and detailed descriptions for any image.
            </p>
          </div>

          {/* API Key Input Section */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 mb-8">
            <label className="block text-slate-700 font-bold mb-2 flex items-center gap-2">
              <i className="fas fa-key text-brand"></i>
              Your Gemini API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm whitespace-nowrap"
              >
                <i className="fas fa-external-link-alt"></i>
                Get Free Key
              </a>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-8">
              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  image ? 'border-purple-200 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                />
                
                {!image ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-cloud-upload-alt text-3xl text-[#764ba2]"></i>
                    </div>
                    <span className="text-slate-600 font-bold text-xl">Click to upload an image</span>
                    <span className="text-slate-400 text-sm mt-1">PNG, JPG, WebP up to 10MB</span>
                  </div>
                ) : (
                  <div className="relative group">
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="max-h-80 mx-auto rounded-xl shadow-md transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <span className="text-white font-bold flex items-center gap-2">
                        <i className="fas fa-sync-alt"></i>
                        Change Image
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={analyzeImage}
                disabled={!image || loading}
                className={`w-full mt-6 py-4 rounded-2xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-2 hover-lift ${
                  !image || loading 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-brand-gradient'
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    Generate Description
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center flex items-center justify-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
              {/* Description Card */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 text-[#764ba2] rounded-2xl flex items-center justify-center shadow-inner">
                    <i className="fas fa-align-right text-xl"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">الوصف التفصيلي (Arabic)</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-right whitespace-pre-wrap text-lg" dir="rtl">
                  {result.description}
                </p>
              </div>

              {/* Prompt Card */}
              <div className="bg-[#1a1a2e] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10">
                  <i className="fas fa-code text-9xl"></i>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 relative z-10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                      <i className="fas fa-bolt text-xl text-yellow-400"></i>
                    </div>
                    <h2 className="text-2xl font-bold">Image Prompt (English)</h2>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(result.prompt)}
                    className="bg-white/10 hover:bg-white/25 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold backdrop-blur-md border border-white/10"
                  >
                    <i className="fas fa-copy"></i>
                    Copy Prompt
                  </button>
                </div>
                
                <div className="bg-black/30 rounded-2xl p-6 font-mono text-lg border border-white/5 relative z-10 break-words leading-relaxed selection:bg-purple-500/50" dir="ltr">
                  {result.prompt}
                </div>
                <div className="mt-6 flex items-center gap-3 text-indigo-300 text-sm font-medium">
                  <i className="fas fa-lightbulb"></i>
                  <span>Tip: Use this prompt in DALL-E 3 or Midjourney for best results.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instagram-style Footer */}
      <footer className="bg-brand-gradient text-white py-12 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="mb-6 animate-bounce">
            <i className="fas fa-heart text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">Made with Love ❤️</h2>
          <p className="text-white/80 max-w-md mb-8">
            Created to empower creators with instant AI-driven visual understanding.
          </p>
          
          <a 
            href="https://www.instagram.com/eman.i.mohamed/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl transition-all hover-lift border border-white/20 group mb-8"
          >
            <div className="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg">
              <i className="fab fa-instagram"></i>
            </div>
            <div className="text-left">
              <span className="block text-xs uppercase tracking-widest text-white/60">Follow Me</span>
              <span className="block font-bold text-lg group-hover:text-white transition-colors">@eman.i.mohamed</span>
            </div>
          </a>

          <div className="space-y-2">
            <p className="text-white/70 text-sm">
              Support me on Instagram: <span className="font-bold">@eman.i.mohamed</span>
            </p>
            <div className="w-12 h-1 bg-white/20 mx-auto rounded-full my-4"></div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-[0.2em]">
              Developed by Eman Mohamed 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
