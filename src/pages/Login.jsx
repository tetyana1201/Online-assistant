import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        alert(data.message || "Невірні дані для входу");
      }
    } catch {
      alert("Сервер не відповідає. Перевірте підключення.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[150px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[150px] opacity-60"></div>

      <div className="relative z-10 max-w-5xl w-full grid md:grid-cols-2 bg-white/60 backdrop-blur-3xl rounded-[4rem] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white/50 overflow-hidden">
        <div className="p-12 md:p-20 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🌱</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Твій прогрес <br /> чекає на тебе.
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xs">
              Увійдіть, щоб продовжити аналіз продуктів та отримувати поради.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold"
                >
                  {i === 4 ? "+2k" : `U${i}`}
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Приєднуйся до 2000+ користувачів
            </p>
          </div>
        </div>

        <div className="p-12 md:p-20 bg-white/40 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 mb-2">Вхід</h3>
            <p className="text-slate-500 font-bold text-sm">
              Введіть свої дані нижче
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.15em] group-focus-within:text-emerald-500 transition-colors">
                Email адреса
              </label>
              <input
                type="email"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full p-5 bg-white rounded-3xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-slate-700 shadow-sm"
              />
            </div>

            <div className="group space-y-2 relative">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-focus-within:text-emerald-500 transition-colors">
                  Пароль
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readonly")}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-5 bg-white rounded-3xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-slate-700 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors p-1"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-emerald-600 hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Увійти до профілю"
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-500">
              Вперше тут?
              <button
                onClick={() => navigate("/survey")}
                className="ml-2 text-emerald-600 hover:text-emerald-400 transition-colors underline underline-offset-4"
              >
                Створити акаунт безкоштовно
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
