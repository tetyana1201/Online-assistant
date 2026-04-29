import React from "react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Аналіз інгредієнтів",
      desc: "Ми розбираємо склад складних продуктів на прості та зрозумілі елементи, підсвічуючи шкідливі добавки.",
      icon: "🧪",
    },
    {
      title: "Розумні сповіщення",
      desc: "Якщо в продукті є ваш алерген (лактоза, глютен тощо), додаток миттєво попередить вас про це.",
      icon: "⚠️",
    },
    {
      title: "Трекінг здоров'я",
      desc: "Ваш ІМТ та метаболізм розраховуються автоматично, допомагаючи тримати форму без зайвих зусиль.",
      icon: "📈",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans text-slate-900 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <button
          onClick={() => navigate("/")}
          className="mb-12 flex items-center gap-2 text-slate-400 font-bold hover:text-emerald-600 transition-colors uppercase text-xs tracking-widest"
        >
          ← На головну
        </button>

        <header className="mb-20">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Твій персональний <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
              помічник завжди поруч.
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
            Ми створили цей інструмент для тих, хто втомився читати дрібний
            шрифт на етикетках і хоче точно знати, що потрапляє в їхній
            організм.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-4xl mb-6">{f.icon}</div>
              <h3 className="text-xl font-bold mb-4">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 relative z-10">
            Готові почати шлях до <br /> здорового життя?
          </h2>
          <button
            onClick={() => navigate("/survey")}
            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 relative z-10"
          >
            Заповнити анкету
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;
