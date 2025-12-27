
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

  // تحميل مفتاح API من localStorage عند البدء
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
      alert("يرجى إدخال مفتاح API الخاص بك أولاً!");
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
                text: `حلل هذه الصورة بعناية فائقة. 
                1. قدم وصفاً تفصيلياً وشاملاً باللغة العربية.
                2. صغ أمراً احترافياً باللغة الإنجليزية لتوليد صورة مشابهة (Prompt) لاستخدامه في Midjourney أو DALL-E.
                
                يجب أن يكون الرد بتنسيق JSON حصراً:
                {
                  "description": "النص العربي هنا",
                  "prompt": "The English prompt here"
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
        throw new Error("لم يتم استلام أي استجابة من النموذج.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('403') || err.message?.includes('API_KEY_INVALID')) {
        setError("مفتاح API غير صالح. يرجى التحقق من المفتاح والمحاولة مرة أخرى.");
      } else {
        setError("حدث خطأ أثناء التحليل. يرجى التأكد من صلاحية المفتاح ووجود رصيد متاح.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("تم النسخ إلى الحافظة!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-purple-100" dir="rtl">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* صندوق المعلومات */}
          <div className="mb-6 p-4 bg-blue-50 border-r-4 border-blue-500 rounded-l-xl shadow-sm">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-1 text-lg"></i>
              <p className="text-blue-800 text-sm md:text-base leading-relaxed">
                <span className="font-bold">ملاحظة:</span> هذه الأداة تعمل باستخدام <span className="underline">مفتاح API الخاص بك</span>. 
                احصل على مفتاحك المجاني من <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-600 transition-colors">aistudio.google.com/apikey</a> 
                - كل مستخدم يستخدم حسابه الخاص وحصته المجانية من جوجل.
              </p>
            </div>
          </div>

          {/* العنوان والوصف */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] mb-3 leading-tight">
              واصف الصور الذكي - إيمان محمد
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              أداة ذكية لوصف الصور آلياً باستخدام ذكاء Gemini الاصطناعي. استخدم مفتاح API الخاص بك للحصول على أوصاف دقيقة وتفصيلية لأي صورة.
            </p>
          </div>

          {/* قسم إدخال مفتاح API */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 mb-8">
            <label className="block text-slate-700 font-bold mb-2 flex items-center gap-2">
              <i className="fas fa-key text-brand"></i>
              مفتاح Gemini API الخاص بك
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  placeholder="ألصق مفتاح API هنا..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all ltr-content"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                احصل على مفتاح مجاني
              </a>
            </div>
          </div>

          {/* بطاقة رفع الصورة */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-8">
              {/* منطقة الرفع */}
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
                    <span className="text-slate-600 font-bold text-xl">اضغط هنا لرفع صورة</span>
                    <span className="text-slate-400 text-sm mt-1">PNG, JPG, WebP حتى 10 ميجابايت</span>
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
                        تغيير الصورة
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* زر الإجراء */}
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
                    جاري تحليل الصورة...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    ابدأ الوصف والتحليل
                  </>
                )}
              </button>

              {/* رسالة الخطأ */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center flex items-center justify-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* منطقة النتائج */}
          {result && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
              {/* بطاقة الوصف بالعربي */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 text-[#764ba2] rounded-2xl flex items-center justify-center shadow-inner">
                    <i className="fas fa-align-right text-xl"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">الوصف التفصيلي (بالعربية)</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-right whitespace-pre-wrap text-lg">
                  {result.description}
                </p>
              </div>

              {/* بطاقة الـ Prompt بالإنجليزي */}
              <div className="bg-[#1a1a2e] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-[-20px] left-[-20px] opacity-10">
                  <i className="fas fa-code text-9xl"></i>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 relative z-10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                      <i className="fas fa-bolt text-xl text-yellow-400"></i>
                    </div>
                    <h2 className="text-2xl font-bold">أمر توليد الصورة (Prompt)</h2>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(result.prompt)}
                    className="bg-white/10 hover:bg-white/25 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold backdrop-blur-md border border-white/10"
                  >
                    <i className="fas fa-copy"></i>
                    نسخ الأمر
                  </button>
                </div>
                
                <div className="bg-black/30 rounded-2xl p-6 font-mono text-lg border border-white/5 relative z-10 break-words leading-relaxed selection:bg-purple-500/50 ltr-content">
                  {result.prompt}
                </div>
                <div className="mt-6 flex items-center gap-3 text-indigo-300 text-sm font-medium">
                  <i className="fas fa-lightbulb"></i>
                  <span>نصيحة: استخدم هذا النص في DALL-E 3 أو Midjourney للحصول على نتائج مذهلة.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* تذييل الصفحة (ستايل إنستغرام) */}
      <footer className="bg-brand-gradient text-white py-12 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="mb-6 animate-bounce">
            <i className="fas fa-heart text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">صنع بكل حب ❤️</h2>
          <p className="text-white/80 max-w-md mb-8">
            تم تطوير هذه الأداة لمساعدة المبدعين على فهم الصور وتوليد أوامر إبداعية فورية.
          </p>
          
          <a 
            href="https://www.instagram.com/eman.i.mohamed/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl transition-all hover-lift border border-white/20 group mb-8 ltr-content"
          >
            <div className="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg">
              <i className="fab fa-instagram text-white"></i>
            </div>
            <div className="text-left">
              <span className="block text-xs uppercase tracking-widest text-white/60">Follow Me</span>
              <span className="block font-bold text-lg group-hover:text-white transition-colors">@eman.i.mohamed</span>
            </div>
          </a>

          <div className="space-y-2">
            <p className="text-white/70 text-sm">
              ادعمني على إنستغرام: <span className="font-bold">@eman.i.mohamed</span>
            </p>
            <div className="w-12 h-1 bg-white/20 mx-auto rounded-full my-4"></div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-[0.2em]">
              تم التطوير بواسطة إيمان محمد 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
