import React, { useState, useEffect } from 'react';
import { Activity, Heart, ArrowRight, ShieldCheck, AlertTriangle, ChevronRight, Download, RefreshCw, BarChart2, Sun, Moon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function App() {
  const [step, setStep] = useState('landing'); // 'landing', 'form', 'loading', 'result'
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // State for all 13 features
  const [formData, setFormData] = useState({
    age: 45,
    sex: 1, // 1 male, 0 female
    cp: 0,
    trestbps: 130,
    chol: 220,
    fbs: 0,
    restecg: 0,
    thalach: 150,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStep('loading');
    setError(null);
    
    try {
      // Send data to FastAPI endpoint
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get prediction');
      }
      
      // Simulate realism delay
      setTimeout(() => {
        setPrediction(data);
        setStep('result');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStep('form');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: formData,
          probability: prediction.probability,
          risk_level: prediction.risk_level
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CardioAI_Report_${formData.age}y_${prediction.risk_level}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to download report: ' + err.message);
    }
  };


  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 bg-gradient-to-br ${darkMode ? 'from-slate-900 to-slate-950 text-slate-100' : 'from-slate-50 to-slate-200 text-slate-800'} font-sans`}>
      
      {/* Background Floating Spheres */}
      <div className={`absolute top-[-10%] left-[-5%] w-96 h-96 ${darkMode ? 'bg-red-500/10 shadow-[0_0_120px_rgba(220,38,38,0.2)]' : 'bg-red-500/20 shadow-[0_0_100px_rgba(220,38,38,0.4)]'} rounded-full blur-3xl animate-pulse-slow`}></div>
      <div className={`absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] ${darkMode ? 'bg-rose-400/10 shadow-[0_0_180px_rgba(251,113,133,0.15)]' : 'bg-rose-400/20 shadow-[0_0_150px_rgba(251,113,133,0.3)]'} rounded-full blur-3xl animate-pulse-slow`} style={{ animationDelay: '1s' }}></div>
      <div className={`absolute top-[40%] right-[15%] w-32 h-32 ${darkMode ? 'bg-red-600/20 shadow-[0_0_80px_rgba(220,38,38,0.3)]' : 'bg-red-600/30 shadow-[0_0_50px_rgba(220,38,38,0.5)]'} rounded-full blur-2xl animate-ping-slow`}></div>
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'}}></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen items-center justify-center">
        
        {/* Navigation/Header area */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 font-bold opacity-90">
            <Activity size={24} />
            <span className="tracking-wider">CardioAI</span>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl transition-all duration-300 ${darkMode ? 'bg-slate-800 text-yellow-400 border border-white/10 hover:bg-slate-700' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'} shadow-lg`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {step === 'landing' && (
          <div className="flex flex-col items-center text-center animate-fade-in max-w-2xl mt-12">
            <div className="relative mb-8">
              <Heart className="text-red-500 w-24 h-24 absolute opacity-20 animate-ping-slow" />
              <Heart className="text-red-600 w-24 h-24 relative z-10" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-400">
              Heart Disease Predictor
            </h1>
            <p className={`text-lg md:text-xl ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-10 max-w-xl mx-auto`}>
              AI-powered cardiovascular risk analysis based on clinical parameters. Fast, precise, and secure.
            </p>
            
            <button 
              onClick={() => setStep('form')}
              className="group relative px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-red-500/40"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">Get Started</span>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="w-full max-w-3xl glass-panel section-glow rounded-3xl p-6 md:p-10 animate-fade-in mt-12">
            <div className={`mb-8 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'} pb-4 flex justify-between items-end`}>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Clinical Data Input</h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Please provide accurate parameters for evaluation</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1 */}
              <div className="flex flex-col gap-2 relative">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Age ({formData.age} yrs)</label>
                <input type="range" name="age" min="20" max="100" value={formData.age} onChange={handleChange} className="w-full mt-2" />
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Sex</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({...formData, sex: 1})} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${formData.sex === 1 ? 'bg-red-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'}`}>Male</button>
                  <button type="button" onClick={() => setFormData({...formData, sex: 0})} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${formData.sex === 0 ? 'bg-red-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'}`}>Female</button>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Chest Pain Type (0-3)</label>
                <select name="cp" value={formData.cp} onChange={handleChange} className="glass-input p-3 rounded-xl appearance-none">
                  <option value={0}>Typical Angina</option>
                  <option value={1}>Atypical Angina</option>
                  <option value={2}>Non-anginal Pain</option>
                  <option value={3}>Asymptomatic</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Resting Blood Pressure</label>
                <div className="relative">
                  <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} className="glass-input w-full p-3 rounded-xl pr-12" />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">mmHg</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-col gap-2 relative">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Serum Cholestoral</label>
                <div className="relative">
                  <input type="number" name="chol" value={formData.chol} onChange={handleChange} className="glass-input w-full p-3 rounded-xl pr-12" />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">mg/dl</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Max Heart Rate Achieved</label>
                <div className="relative">
                  <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} className="glass-input w-full p-3 rounded-xl pr-10" />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">bpm</span>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Fasting Blood Sugar {'>'} 120</label>
                <button type="button" onClick={() => handleToggle('fbs')} className={`w-full text-left p-3 rounded-xl transition-all border ${formData.fbs === 1 ? 'border-red-500 bg-red-500/10 text-red-500' : 'glass-input text-slate-400'}`}>
                  {formData.fbs === 1 ? 'Yes (True)' : 'No (False)'}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Exercise Induced Angina</label>
                <button type="button" onClick={() => handleToggle('exang')} className={`w-full text-left p-3 rounded-xl transition-all border ${formData.exang === 1 ? 'border-red-500 bg-red-500/10 text-red-500' : 'glass-input text-slate-400'}`}>
                   {formData.exang === 1 ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Row 5 */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>ST Depression (Oldpeak)</label>
                <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} className="glass-input p-3 rounded-xl w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Slope of Peak Ex. ST Segment</label>
                <select name="slope" value={formData.slope} onChange={handleChange} className="glass-input p-3 rounded-xl appearance-none">
                  <option value={0}>Upsloping</option>
                  <option value={1}>Flat</option>
                  <option value={2}>Downsloping</option>
                </select>
              </div>

              {/* Extras */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Num Major Vessels (0-4)</label>
                <input type="number" name="ca" min="0" max="4" value={formData.ca} onChange={handleChange} className="glass-input p-3 rounded-xl w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} ml-1`}>Thalassemia / Stress Test Result</label>
                <select name="thal" value={formData.thal} onChange={handleChange} className="glass-input p-3 rounded-xl appearance-none">
                  <option value={0}>Normal/Unknown</option>
                  <option value={1}>Fixed Defect</option>
                  <option value={2}>Reversable Defect</option>
                  <option value={3}>Other</option>
                </select>
              </div>

              <div className={`col-span-1 md:col-span-2 mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200/50'} flex justify-end`}>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Analyze Pulse <ChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <Heart className="w-24 h-24 text-red-500 absolute z-10" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/40 to-transparent animate-scan z-20 pointer-events-none rounded-full overflow-hidden blur-sm"></div>
            </div>
            <h3 className={`text-xl font-semibold mt-4 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Analyzing Cardiovascular Patterns</h3>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>Processing model inference...</p>
            <div className={`w-48 h-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-full mt-4 overflow-hidden`}>
               <div className="h-full bg-red-500 w-full animate-pulse"></div>
            </div>
          </div>
        )}

        {step === 'result' && prediction && (
          <div className="w-full max-w-4xl animate-fade-in flex flex-col gap-6 mt-12 mb-12">
            
            {/* Top Cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Score Card */}
              <div className="glass-panel section-glow rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden">
                <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Risk Probability</h3>
                
                {/* Circular Gauge simulation */}
                <div className={`relative flex items-center justify-center w-48 h-48 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] border-[12px] ${darkMode ? 'border-slate-800/50' : 'border-white/50'}`}>
                  <div className="absolute inset-2 rounded-full border-4 border-dashed border-red-400/30 animate-spin" style={{ animationDuration: '10s'}}></div>
                  <div className="z-10 flex flex-col items-center justify-center">
                     <span className={`text-5xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{(prediction.probability * 100).toFixed(1)}<span className="text-2xl text-slate-400">%</span></span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-400">
                    {prediction.risk_level === 'High' ? 'Elevated Warning' : prediction.risk_level === 'Low' ? 'Optimal Range' : 'Moderate Notice'}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Based on global patient cohort data</p>
                </div>
              </div>

              {/* Status & Next steps */}
              <div className="glass-panel section-glow rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    {prediction.risk_level === 'Low' ? (
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shadow-sm"><ShieldCheck size={24} /></div>
                    ) : prediction.risk_level === 'Moderate' ? (
                       <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-sm"><AlertTriangle size={24} /></div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm"><Activity size={24} /></div>
                    )}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Status</h3>
                      <p className={`text-xl font-bold ${prediction.risk_level === 'Low' ? 'text-green-500' : prediction.risk_level === 'High' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {prediction.risk_level} Risk Level
                      </p>
                    </div>
                  </div>

                  <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed`}>
                    {prediction.risk_level === 'Low' 
                      ? "Your clinical data suggests a healthy cardiovascular profile. Continue maintaining a balanced lifestyle." 
                      : "The model detected anomalies aligning with cardiovascular disease. We highly recommend consulting a specialist for comprehensive screening."}
                  </p>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setStep('form')} className={`flex-1 py-3 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white/60 hover:bg-white text-slate-700'} font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm`}>
                    <RefreshCw size={16} /> Re-evaluate
                  </button>
                  <button onClick={handleDownloadReport} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shadow-red-500/20">
                    <Download size={16} /> Report
                  </button>

                </div>
              </div>
            </div>

            {/* Explanability / SHAP Placeholder component */}
            <div className="glass-panel section-glow rounded-3xl p-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                 <BarChart2 className="text-rose-500" />
                 <h3 className={`text-xl font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Feature Analysis Matrix</h3>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-6`}>A simulated visualization of how your specific parameters influenced the model's decision.</p>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Max Heart Rate', impact: 0.75, fill: '#dc2626' },
                    { name: 'Chest Pain', impact: 0.65, fill: '#ef4444' },
                    { name: 'Age', impact: 0.45, fill: '#f87171' },
                    { name: 'ST Depr.', impact: 0.55, fill: '#fb7185' },
                    { name: 'Slope', impact: 0.40, fill: '#fca5a5' },
                  ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} width={120} />
                    <Tooltip cursor={{fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: darkMode ? '#f1f5f9' : '#0f172a' }} />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;

