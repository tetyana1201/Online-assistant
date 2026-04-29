import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://world.openfoodfacts.org";
const USER_AGENT = "FoodSurveyTest/1.0-dev (tatyana.dev@gmail.com)";

const Survey = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [gender, setGender] = useState("male");
  const [userType, setUserType] = useState("me");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualChanges, setManualChanges] = useState({});

  const searchProductsByName = async (query) => {
    const searchQuery = query.trim() || "інгредієнт";

    setLoading(true);
    try {
      const params = new URLSearchParams({
        search_terms: searchQuery,
        search_simple: 1,
        action: "process",
        json: 1,
        page: 1,
        page_size: 100,
        fields: "code,product_name,product_name_uk,brands",
        lc: "uk",
        cc: "ua",
      });

      const res = await fetch(`${BASE_URL}/cgi/search.pl?${params}`, {
        headers: { "User-Agent": USER_AGENT },
      });

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Помилка API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 9 && products.length === 0) {
      searchProductsByName("а");
    }
  }, [step, products.length]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchProductsByName(searchTerm);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const toggleStatus = (p) => {
    setManualChanges((prev) => {
      const code = p.code;
      const currentEntry = prev[code];
      const currentStatus =
        typeof currentEntry === "object"
          ? currentEntry.status
          : currentEntry || "allow";

      const order = ["allow", "limit", "avoid"];
      const nextStatus = order[(order.indexOf(currentStatus) + 1) % 3];

      return {
        ...prev,
        [code]: {
          status: nextStatus,
          name: (
            p.product_name_uk ||
            p.product_name ||
            "Невідомий продукт"
          ).replace(/&quot;/g, '"'),
          brand: p.brands || "",
        },
      };
    });
  };

  const goals = [
    { id: "allergy", name: "Мінімізація алергії", icon: "🛡️" },
    { id: "safety", name: "Безпечні продукти", icon: "🔍" },
    { id: "weight", name: "Контроль ваги", icon: "⚖️" },
    { id: "ingredients", name: "Вивчення складу", icon: "🧪" },
  ];

  const dietTypes = [
    { id: "anti_inf", name: "Антизапальна", icon: "🥗" },
    { id: "lactose_free", name: "Без лактози", icon: "🥛" },
    { id: "gluten_free", name: "Без глютену", icon: "🌾" },
    { id: "low_fodmap", name: "Low FODMAP", icon: "🍎" },
    { id: "gerd", name: "При ГЕРХ", icon: "🧘" },
    { id: "keto", name: "Кето дієта", icon: "🥑" },
  ];

  const commonAllergens = [
    { id: "peanuts", name: "Арахіс", icon: "🥜" },
    { id: "eggs", name: "Яйця", icon: "🥚" },
    { id: "fish", name: "Риба", icon: "🐟" },
    { id: "shellfish", name: "Молюски", icon: "🦐" },
    { id: "tree_nuts", name: "Горіхи", icon: "🌳" },
    { id: "soy", name: "Соя", icon: "🌱" },
    { id: "wheat", name: "Пшениця", icon: "🍞" },
    { id: "milk", name: "Молоко", icon: "🥛" },
  ];

  const calculateBMI = () => {
    if (!weight || !height || height <= 0) return null;
    return (weight / (height / 100) ** 2).toFixed(1);
  };

  const calculateBMR = () => {
    if (!weight || !height || !age) return null;

    let bmr = 10 * weight + 6.25 * height - 5 * age;

    if (userType === "child") bmr *= 1.25;

    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    return Math.round(bmr);
  };

  const bmiValue = calculateBMI();

  const getBMIColor = (bmi) => {
    const val = parseFloat(bmi);
    if (val < 18.5) return "#93c5fd";
    if (val < 25.0) return "#10b981";
    return "#f472b6";
  };

  const getRotation = (bmi) => {
    const val = parseFloat(bmi);
    if (!val || val <= 10) return -90;
    if (val >= 35) return 90;

    if (val < 18.5) {
      return ((val - 10) / (18.5 - 10)) * 60 - 90;
    }

    if (val <= 24.9) {
      return ((val - 18.5) / (24.9 - 18.5)) * 60 - 30;
    }

    return ((val - 24.9) / (35 - 24.9)) * 60 + 30;
  };

  const finishSurvey = () => {
    const surveyData = {
      goal,
      experience,
      gender,
      userType,
      weight: parseFloat(weight),
      height: parseFloat(height),
      age: parseInt(age),
      bmi: parseFloat(bmiValue),
      bmr: calculateBMR(),
      restrictions: selectedRestrictions,
      manualChanges,
    };

    navigate("/signup", { state: { tempSurveyData: surveyData } });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans text-slate-900">
      <div className="max-w-xl w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-10 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${(step / 9) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-black leading-tight tracking-tight">
                Яка ваша мета?
              </h2>
              <p className="text-slate-500 font-medium tracking-tight">
                Це допоможе нам налаштувати аналіз продуктів
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${goal === g.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-50 bg-slate-50 hover:border-slate-200"}`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <span className="font-bold text-[11px] uppercase tracking-wider">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
            <button
              disabled={!goal}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-[#0f172a] text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-20"
            >
              Продовжити
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black">Ваш досвід</h2>
              <p className="text-slate-500 font-medium tracking-tight">
                Як добре ви знаєте склад продуктів?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  id: "Novice",
                  l: "Новачок",
                  d: "Тільки вчуся читати етикетки",
                  i: "🌱",
                },
                {
                  id: "Middle",
                  l: "Середній",
                  d: "Знаю основні шкідливі добавки",
                  i: "🌿",
                },
                {
                  id: "Pro",
                  l: "Профі",
                  d: "Розуміюся на кожному інгредієнті",
                  i: "🌳",
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setExperience(lvl.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left ${experience === lvl.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-50 bg-slate-50 hover:border-slate-100"}`}
                >
                  <span className="text-4xl">{lvl.i}</span>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-lg leading-tight">
                      {lvl.l}
                    </span>
                    <span className="text-xs text-slate-500 font-bold mt-0.5">
                      {lvl.d}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl uppercase text-xs"
              >
                Назад
              </button>
              <button
                disabled={!experience}
                onClick={() => setStep(3)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl transition-all"
              >
                Далі
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Для кого профіль?
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: "me", name: "Для мене", icon: "🙋‍♀️" },
                { id: "child", name: "Для дитини", icon: "👶" },
                { id: "other", name: "Інша людина", icon: "🤝" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 text-left ${userType === type.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-50 bg-slate-50"}`}
                >
                  <span className="text-4xl">{type.icon}</span>
                  <span className="font-black text-slate-900 text-lg">
                    {type.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl uppercase text-xs hover:bg-slate-100"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl"
              >
                Далі
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Ваша стать
            </h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setGender("male")}
                className={`p-6 rounded-[2rem] border-2 transition-all font-bold text-xl ${gender === "male" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-50 text-slate-400"}`}
              >
                👨 Чоловік
              </button>
              <button
                onClick={() => setGender("female")}
                className={`p-6 rounded-[2rem] border-2 transition-all font-bold text-xl ${gender === "female" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-50 text-slate-400"}`}
              >
                👩 Жінка
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl uppercase text-xs hover:bg-slate-100"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl"
              >
                Далі
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <h2 className="text-3xl font-black tracking-tight">
              Ваші параметри
            </h2>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">
                  ВІК
                </label>
                <input
                  type="number"
                  placeholder="Вік"
                  className="w-full p-4 bg-emerald-50/50 rounded-[1.2rem] border-none outline-none font-black text-center text-xl text-emerald-900"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">
                  РІСТ (СМ)
                </label>
                <input
                  type="number"
                  placeholder="Ріст (см)"
                  className="w-full p-4 bg-emerald-50/50 rounded-[1.2rem] border-none outline-none font-black text-center text-xl text-emerald-900"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">
                ВАША ВАГА (КГ)
              </label>
              <input
                type="number"
                placeholder="Вага (кг)"
                className="w-full p-4 bg-[#f0f9f6] rounded-[1.5rem] border-2 border-emerald-400 outline-none font-black text-center text-4xl text-emerald-900 transition-all"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            {weight && height && (
              <div className="flex flex-col items-center pt-2">
                <svg
                  width="280"
                  height="140"
                  viewBox="0 0 240 130"
                  className="overflow-visible font-black"
                >
                  <defs>
                    <path id="pB" d="M 35 115 A 85 85 0 0 1 70 55" />
                    <path id="pP" d="M 170 55 A 85 85 0 0 1 205 115" />
                  </defs>

                  <path
                    d="M 30 120 A 90 90 0 0 1 77 45"
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="42"
                  />
                  <path
                    d="M 77 45 A 90 90 0 0 1 163 45"
                    fill="none"
                    stroke="#99f6e4"
                    strokeWidth="42"
                  />
                  <path
                    d="M 163 45 A 90 90 0 0 1 210 120"
                    fill="none"
                    stroke="#f472b6"
                    strokeWidth="42"
                  />

                  <text
                    x="67"
                    y="7"
                    fontSize="11"
                    fill="#64748b"
                    fontWeight="black"
                  >
                    18.5
                  </text>
                  <text
                    x="155"
                    y="7"
                    fontSize="11"
                    fill="#64748b"
                    fontWeight="black"
                  >
                    24.9
                  </text>

                  <text
                    x="120"
                    y="39"
                    fontSize="8"
                    fill="#0f766e"
                    textAnchor="middle"
                    fontWeight="black"
                  >
                    НОРМАЛЬНО
                  </text>

                  <text fontSize="7" fontWeight="900">
                    <textPath
                      href="#pB"
                      startOffset="50%"
                      textAnchor="middle"
                      fill="#1e40af"
                    >
                      НИЖЧЕ НОРМИ
                    </textPath>
                    <textPath
                      href="#pP"
                      startOffset="50%"
                      textAnchor="middle"
                      fill="#9d174d"
                    >
                      ВИЩЕ НОРМИ
                    </textPath>
                  </text>

                  <g
                    style={{
                      transform: `rotate(${getRotation(bmiValue)}deg)`,
                      transformOrigin: "120px 120px",
                      transition: "all 1.5s ease",
                    }}
                  >
                    <line
                      x1="120"
                      y1="120"
                      x2="120"
                      y2="40"
                      stroke="#1e293b"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <circle cx="120" cy="120" r="8" fill="#1e293b" />
                  </g>
                </svg>

                <div className="mt-2 text-center space-y-2">
                  <p
                    className="text-3xl font-black leading-none tracking-tight transition-all"
                    style={{ color: getBMIColor(bmiValue) }}
                  >
                    IMT: {bmiValue}
                  </p>
                  {calculateBMR() && (
                    <div className="bg-[#f0f9f6] px-5 py-1.5 rounded-full inline-block">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                        Метаболізм: {calculateBMR()} ккал
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl uppercase text-xs hover:bg-slate-100"
              >
                Назад
              </button>
              <button
                disabled={!weight || !height || !age}
                onClick={() => setStep(6)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl transition-all text-lg"
              >
                Далі
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Обмеження</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Виберіть дієти та алергени
              </p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-300 uppercase ml-2 tracking-widest">
                  Популярні дієти
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {dietTypes.map((d) => (
                    <button
                      key={d.id}
                      onClick={() =>
                        setSelectedRestrictions((prev) =>
                          prev.includes(d.id)
                            ? prev.filter((x) => x !== d.id)
                            : [...prev, d.id],
                        )
                      }
                      className={`p-4 rounded-[1.5rem] border-2 transition-all flex items-center gap-3 ${selectedRestrictions.includes(d.id) ? "border-emerald-500 bg-emerald-50" : "border-slate-50 bg-slate-50 hover:border-slate-100"}`}
                    >
                      <span className="text-xl">{d.icon}</span>
                      <span className="text-[11px] font-black text-slate-700 leading-tight">
                        {d.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black text-slate-300 uppercase ml-2 tracking-widest">
                  Алергени та непереносимість
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {commonAllergens.map((a) => (
                    <button
                      key={a.id}
                      onClick={() =>
                        setSelectedRestrictions((prev) =>
                          prev.includes(a.id)
                            ? prev.filter((x) => x !== a.id)
                            : [...prev, a.id],
                        )
                      }
                      className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-1 text-center ${selectedRestrictions.includes(a.id) ? "border-rose-400 bg-rose-50" : "border-slate-50 bg-slate-50 hover:border-slate-100"}`}
                    >
                      <span className="text-xl">{a.icon}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStep(5)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl text-xs uppercase hover:bg-slate-100 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(7)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                Продовжити
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-8 animate-in fade-in duration-500 text-center">
            <h2 className="text-3xl font-black leading-tight">
              Чи є ще якісь інгредієнти, яких ви уникаєте?
            </h2>

            <div className="flex flex-col gap-4">
              {[
                { id: "yes", label: "Так" },
                { id: "no", label: "Ні" },
                { id: "unsure", label: "Невпевнений" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() =>
                    btn.id === "no" ? finishSurvey() : setStep(8)
                  }
                  className="p-5 rounded-2xl border bg-slate-50 font-bold text-left hover:bg-slate-100 transition-all"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStep(6)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl text-xs uppercase hover:bg-slate-100 transition-colors"
              >
                Назад
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-8 text-center animate-in fade-in">
            <h2 className="text-4xl font-black">Один останній крок!</h2>

            <p className="text-slate-500 font-medium">
              Складіть свій персоналізований список інгредієнтів, які ви їсте,
              обмежуєте та уникаєте
            </p>

            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
              <p className="font-bold text-sm">
                У вас буде 3 варіанти на вибір:
              </p>

              <div className="flex justify-around items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                    ✓
                  </div>
                  <span className="text-xs font-bold">Можна їсти</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-xl">
                    —
                  </div>
                  <span className="text-xs font-bold">Обмежити</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl">
                    ✕
                  </div>
                  <span className="text-xs font-bold">Уникати</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStep(7)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl text-xs uppercase hover:bg-slate-100 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(9)}
                className="flex-[2] py-5 bg-[#0f172a] text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                Продовжити
              </button>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-500 h-[500px]">
            <header className="text-center mb-6">
              <h1 className="text-3xl font-black mb-2">Змінити інгредієнти</h1>
              <p className="text-gray-400 text-sm font-medium">
                Натисніть на інгредієнти, щоб змінити їх!
              </p>
            </header>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Пошук інгредієнтів"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F7F9FC] p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-[#8A5CF5] transition-all font-bold"
              />
            </div>

            <div className="flex justify-between text-[11px] text-gray-400 mb-4 px-1 font-black uppercase tracking-widest">
              <span>Показано {products.length} результатів</span>
              <button
                onClick={() => setManualChanges({})}
                className="underline hover:text-[#8A5CF5]"
              >
                Скинути зміни
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scroll max-h-[350px]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8A5CF5]"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => {
                    const data = manualChanges[p.code];
                    const status =
                      typeof data === "object" ? data.status : data || "allow";
                    const displayName = (
                      p.product_name_uk ||
                      p.product_name ||
                      "Невідомий продукт"
                    ).replace(/&quot;/g, '"');

                    return (
                      <div
                        key={p.code}
                        onClick={() => toggleStatus(p)}
                        className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                          status !== "allow"
                            ? "border-[#8A5CF5] bg-purple-50/30"
                            : "border-gray-100 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div
                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm transition-colors ${
                              status === "allow"
                                ? "bg-emerald-500"
                                : status === "limit"
                                  ? "bg-yellow-400"
                                  : "bg-orange-500"
                            }`}
                          >
                            {status === "allow" && "✓"}
                            {status === "limit" && "—"}
                            {status === "avoid" && "✕"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[15px] leading-tight">
                              {displayName}
                            </span>
                            {p.brands && (
                              <span className="text-[10px] text-gray-400 uppercase font-black mt-0.5">
                                {p.brands}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-300 font-bold">
                          i
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 mt-auto">
              <button
                onClick={() => setStep(8)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-wider"
              >
                Назад
              </button>
              <button
                onClick={finishSurvey}
                className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all"
              >
                Завершити
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Survey;
