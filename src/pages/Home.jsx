import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center z-30">
        <div
          onClick={() => navigate("/")}
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
            Life<span className="text-emerald-500">Scan</span>
          </h1>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 text-sm md:text-base text-slate-600 font-bold hover:text-green-600 transition-colors flex items-center gap-2"
        >
          <span className="hidden sm:inline text-slate-400 font-medium">
            Вже є профіль?
          </span>
          <span className="text-slate-900 underline decoration-green-400 decoration-2 underline-offset-4">
            Увійти
          </span>
        </button>
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[120px] opacity-50"></div>

      <div className="relative z-10 max-w-6xl w-full mt-24 md:mt-0 grid md:grid-cols-2 gap-12 md:gap-16 items-center bg-white/40 backdrop-blur-2xl p-6 md:p-16 rounded-[2.5rem] md:rounded-[3rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50/60 backdrop-blur-sm border border-emerald-100 px-3 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-black text-emerald-800 uppercase tracking-wider leading-tight">
              Онлайн-помічник для людей із харчовими обмеженнями
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 md:mb-8 leading-[1.1] tracking-tight">
            Здоров'я — <br />
            <span className="inline-block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
              це вибір.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 leading-relaxed max-w-md font-medium">
            Ми допоможемо тобі аналізувати склад продуктів, уникати алергенів та
            тримати вагу в нормі.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 md:mb-0">
            <button
              onClick={() => navigate("/survey")}
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-lg active:scale-95 text-center"
            >
              Спробувати безкоштовно
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-center shadow-sm"
            >
              Дізнатися більше
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 items-start">
          <div className="space-y-3 md:space-y-6 md:pt-12">
            <div className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:animate-bounce">
                🛡️
              </div>
              <h3 className="font-bold text-sm md:text-base text-slate-800">
                Безпека
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 leading-tight md:leading-normal font-medium">
                Контроль алергенів.
              </p>
            </div>

            <div className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:animate-bounce">
                🤖
              </div>
              <h3 className="font-bold text-sm md:text-base text-slate-800">
                ШІ Поради
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 leading-tight md:leading-normal font-medium">
                Рекомендації Gemini.
              </p>
            </div>
          </div>

          <div className="space-y-3 md:space-y-6">
            <div className="group bg-green-600 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-lg text-white transform hover:scale-[1.05] transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:animate-pulse">
                📊
              </div>
              <h3 className="font-bold text-sm md:text-base">Аналітика</h3>
              <p className="text-[10px] md:text-xs text-green-100 leading-tight md:leading-normal font-medium">
                Розрахунок ІМТ.
              </p>
            </div>

            <div className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 hover:border-green-400 transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:animate-bounce">
                🔍
              </div>
              <h3 className="font-bold text-sm md:text-base text-slate-800">
                Сканер
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 leading-tight md:leading-normal font-medium">
                Перевірка складу.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
