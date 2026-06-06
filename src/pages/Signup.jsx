import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Signup = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const surveyData = location.state?.tempSurveyData;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRegister = async (e) => {
    e.preventDefault();
    
    let localErrors = {};

    if (!email.trim()) {
      localErrors.email = "Будь ласка, введіть електронну пошту";
    }
    if (!password.trim()) {
      localErrors.password = "Будь ласка, придумайте пароль";
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+(?:\.[a-zA-Z]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      localErrors.email = "Некоректний формат пошти";
    } else if (email.startsWith("-") || email.includes("-@")) {
      localErrors.email = "Пошта не може починатися або закінчуватися на дефіс";
    }

    if (password.length < 8) {
      localErrors.password = "Пароль має містити не менше 8 символів";
    } else if (!/[A-ZА-ЯІЇЄҐ]/.test(password)) {
      localErrors.password = "Додайте хоча б одну велику літеру";
    } else if (!/\d/.test(password)) {
      localErrors.password = "Додайте хоча б одну цифру";
    } else if (!/[!@#$%^&*()\-+_=?_./]/.test(password)) {
      localErrors.password = "Додайте хоча б один спецсимвол";
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const finalUserData = {
      email,
      password,
      profile: surveyData,
    };

    try {
      const response = await fetch("https://lifescan-23ke.onrender.com/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalUserData),
      });

      const data = await response.json();

      if (response.ok) {
        const userToStore = {
          email: finalUserData.email,
          profile: finalUserData.profile,
        };
        localStorage.setItem("user", JSON.stringify(userToStore));
        alert("Вітаємо! Ваш профіль збережено.");
        navigate("/dashboard");
      } else {
        setErrors({ server: data.message || "Помилка реєстрації" });
      }
    } catch (err) {
      console.error("Помилка зв'язку з сервером:", err);
      setErrors({ server: "Сервер не відповідає. Перевірте backend." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>

      <div className="relative z-10 max-w-4xl w-full grid md:grid-cols-2 bg-white/70 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden">
        
        <div className="p-10 md:p-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center">
          <div className="mb-8">
            <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              Майже готово
            </span>
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight">
            Збережи свій <br /> прогрес
          </h2>
          <p className="text-slate-400 font-medium mb-10 leading-relaxed">
            Ми вже розрахували твої параметри. Створи акаунт, щоб отримати
            доступ до персонального онлайн-помічника.
          </p>

          {surveyData && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Твій ІМТ
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {surveyData.bmi || "—"}
                </span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]"></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {surveyData.restrictions?.slice(0, 3).map((res, i) => (
                  <span key={i} className="text-[10px] bg-white/10 px-3 py-1 rounded-lg font-bold">
                    #{res}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-10 md:p-16 bg-white flex flex-col justify-center">
          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">
                Електронна пошта
              </label>
              <input
                type="email"
                name="registration_email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="example@gmail.com"
                className={`w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 transition-all font-bold text-slate-700 border ${
                  errors.email ? "border-rose-300 focus:ring-rose-500 bg-rose-50/20" : "border-transparent focus:ring-emerald-500 focus:bg-white"
                }`}
              />
              {errors.email && (
                <p className="text-rose-500 text-[11px] font-bold pl-4 animate-in fade-in duration-200">
                  ⚠️ {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">
                Придумайте пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="registration_password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className={`w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 transition-all font-bold text-slate-700 border ${
                    errors.password ? "border-rose-300 focus:ring-rose-500 bg-rose-50/20" : "border-transparent focus:ring-emerald-500 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-[22px] text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-[11px] font-bold pl-4 animate-in fade-in duration-200">
                  ⚠️ {errors.password}
                </p>
              )}
            </div>

            {errors.server && (
              <div className="text-rose-500 text-xs font-bold px-4 py-2 text-center bg-rose-50/50 rounded-xl animate-in fade-in duration-200">
                ❌ {errors.server}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Зберігаємо..." : "Створити акаунт"}
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 font-medium px-4">
              Натискаючи кнопку, ви погоджуєтесь з умовами використання.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-50 text-center">
            <p className="text-sm font-bold text-slate-500">
              Вже маєте акаунт?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-emerald-600 hover:underline"
              >
                Увійти
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;