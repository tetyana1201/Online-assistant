import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[120px] opacity-50"></div>
      <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center bg-white/40 backdrop-blur-2xl p-8 md:p-16 rounded-[3rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        
        <div className="text-left">
          <div className="inline-flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">AI Powered Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
            Твоє тіло — <br />
            <span className="inline-block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                твої правила.
            </span>
          </h1>

          <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-md font-medium">
            Ми допоможемо тобі аналізувати склад продуктів, уникати алергенів та тримати вагу в нормі за допомогою розумних алгоритмів.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/survey')}
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-green-200 active:scale-95"
            >
              Спробувати безкоштовно
            </button>
            <button 
            onClick={() => navigate('/about')}
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              Дізнатися більше
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 items-start">
          <div className="space-y-6 pt-12"> 
            <div className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 hover:scale-[1.03] transition-all duration-300 cursor-default">
              <div className="text-3xl mb-3 group-hover:animate-bounce">🛡️</div>
              <h3 className="font-bold text-slate-800">Безпека</h3>
              <p className="text-xs text-slate-500 leading-normal font-medium">Контроль алергенів у кожному продукті.</p>
            </div>
            
            <div className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 hover:scale-[1.03] transition-all duration-300 cursor-default">
              <div className="text-3xl mb-3 group-hover:animate-bounce">🤖</div>
              <h3 className="font-bold text-slate-800">ШІ Поради</h3>
              <p className="text-xs text-slate-500 leading-normal font-medium">Персональні рекомендації від Gemini.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="group bg-green-600 p-6 rounded-[2rem] shadow-lg text-white transform hover:scale-[1.05] hover:shadow-green-200 transition-all duration-300 cursor-default">
              <div className="text-3xl mb-3 group-hover:animate-pulse">📊</div>
              <h3 className="font-bold">Аналітика</h3>
              <p className="text-xs text-green-100 leading-normal font-medium">Автоматичний розрахунок ІМТ та калорій.</p>
            </div>

            <div className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 hover:scale-[1.03] transition-all duration-300 cursor-default">
              <div className="text-3xl mb-3 group-hover:animate-bounce">🔍</div>
              <h3 className="font-bold text-slate-800">Сканер</h3>
              <p className="text-xs text-slate-500 leading-normal font-medium">Швидка перевірка складу через Open Food Facts.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;