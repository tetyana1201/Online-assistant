import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://world.openfoodfacts.org";
const USER_AGENT = "FoodSurveyTest/1.0-dev (tatyana.dev@gmail.com)";

const Profile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
  const [manualChanges, setManualChanges] = useState({});

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) {
      navigate("/login");
    } else {
      const p = savedUser.profile;
      setGoal(p.goal || "");
      setExperience(p.experience || "");
      setGender(p.gender || "male");
      setUserType(p.userType || "me");
      setWeight(p.weight || "");
      setHeight(p.height || "");
      setAge(p.age || "");
      setSelectedRestrictions(p.restrictions || []);
      setManualChanges(p.manualChanges || {});
    }
  }, [navigate]);

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
        page_size: 50,
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) searchProductsByName(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const toggleStatus = (p) => {
    const product = typeof p === "object" ? p : { code: p };
    const code = product.code;

    setManualChanges((prev) => {
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
            product.product_name_uk ||
            product.product_name ||
            product.name ||
            "Невідомий продукт"
          ).replace(/&quot;/g, '"'),
          brand: product.brands || product.brand || "",
        },
      };
    });
  };

  const calculateBMR = () => {
    if (!weight || !height || !age) return null;

    let bmr = 10 * weight + 6.25 * height - 5 * age;

    if (userType === "child") bmr *= 1.25;

    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    return Math.round(bmr);
  };

  const calculateBMI = () =>
    weight && height > 0 ? (weight / (height / 100) ** 2).toFixed(1) : null;
  const bmiValue = calculateBMI();

  const getRotation = (bmi) => {
    const val = parseFloat(bmi);
    if (!val || val <= 10) return -90;
    if (val >= 35) return 90;
    if (val < 18.5) return ((val - 10) / (18.5 - 10)) * 60 - 90;
    if (val <= 24.9) return ((val - 18.5) / (24.9 - 18.5)) * 60 - 30;
    return ((val - 24.9) / (35 - 24.9)) * 60 + 30;
  };

  const getBMIColor = (bmi) => {
    const val = parseFloat(bmi);
    if (val < 18.5) return "#93c5fd";
    if (val < 25.0) return "#10b981";
    return "#f472b6";
  };

  const handleFinalSave = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    const updatedProfile = {
      goal,
      experience,
      gender,
      userType,
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      bmi: bmiValue,
      bmr: calculateBMR(),
      restrictions: selectedRestrictions,
      manualChanges,
    };

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedUser.email,
          profile: updatedProfile,
        }),
      });

      if (response.ok) {
        const updatedUser = { ...savedUser, profile: updatedProfile };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("Дані успішно збережено в базі! ✨");
        navigate("/profile");
      } else {
        alert("Помилка при збереженні на сервері");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Сервер не відповідає. Дані збережено лише локально.");
    } finally {
      setLoading(false);
    }
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full p-4 mb-6 bg-white rounded-2xl shadow-sm text-left font-black text-xs uppercase text-slate-400 hover:text-emerald-500 transition-all"
          >
            ← Назад до сканера
          </button>
          {[
            { s: 1, t: "Ціль", i: "🎯" },
            { s: 2, t: "Досвід", i: "🧠" },
            { s: 3, t: "Тип профілю", i: "👤" },
            { s: 4, t: "Стать", i: "🧬" },
            { s: 5, t: "Параметри тіла", i: "📏" },
            { s: 6, t: "Дієти", i: "🥗" },
            { s: 9, t: "Інгредієнти", i: "🧪" },
          ].map((item) => (
            <button
              key={item.s}
              onClick={() => setStep(item.s)}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 font-bold transition-all ${step === item.s ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white text-slate-400 hover:bg-slate-50"}`}
            >
              <span>{item.i}</span> {item.t}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full mt-4 p-4 bg-white rounded-2xl flex items-center gap-3 font-bold text-rose-500 shadow-sm border-2 border-transparent hover:border-rose-100 hover:bg-rose-50 transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            <span>Вийти з акаунту</span>
          </button>
        </div>

        <div className="flex-1 bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white min-h-[600px] flex flex-col">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-3xl font-black text-center">
                Оновіть вашу мету
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${goal === g.id ? "border-emerald-500 bg-emerald-50" : "border-slate-50 bg-slate-50"}`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <span className="font-black text-[10px] uppercase tracking-widest">
                      {g.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black text-center">
                Ваш рівень знань
              </h2>
              <div className="space-y-4">
                {[
                  { id: "Novice", l: "Новачок", d: "Тільки вчуся", i: "🌱" },
                  { id: "Middle", l: "Середній", d: "Знаю добавки", i: "🌿" },
                  { id: "Pro", l: "Профі", d: "Все розумію", i: "🌳" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left ${experience === lvl.id ? "border-emerald-500 bg-emerald-50" : "border-slate-50 bg-slate-50"}`}
                  >
                    <span className="text-4xl">{lvl.i}</span>
                    <div>
                      <p className="font-black text-lg">{lvl.l}</p>
                      <p className="text-xs text-slate-400 font-bold">
                        {lvl.d}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500 text-center">
              <h2 className="text-3xl font-black">Для кого профіль?</h2>
              <div className="grid grid-cols-1 gap-4 text-left">
                {[
                  { id: "me", name: "Для мене", icon: "🙋‍♀️" },
                  { id: "child", name: "Для дитини", icon: "👶" },
                  { id: "other", name: "Інша людина", icon: "🤝" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setUserType(type.id)}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${userType === type.id ? "border-emerald-500 bg-emerald-50" : "border-slate-50 bg-slate-50"}`}
                  >
                    <span className="text-4xl">{type.icon}</span>
                    <span className="font-black text-slate-900 text-lg">
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in duration-500 text-center">
              <h2 className="text-3xl font-black">Ваша стать</h2>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setGender("male")}
                  className={`p-6 rounded-[2rem] border-2 transition-all font-bold text-xl ${gender === "male" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-50 text-slate-400"}`}
                >
                  👨 Чоловік
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`p-6 rounded-[2rem] border-2 transition-all font-bold text-xl ${gender === "female" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-50 text-slate-400"}`}
                >
                  👩 Жінка
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in duration-500 text-center">
              <h2 className="text-3xl font-black">Параметри тіла</h2>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 ml-4 tracking-widest uppercase">
                    ВІК
                  </label>
                  <input
                    type="number"
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-center outline-none focus:ring-2 focus:ring-emerald-500"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 ml-4 tracking-widest uppercase">
                    РІСТ (СМ)
                  </label>
                  <input
                    type="number"
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-center outline-none focus:ring-2 focus:ring-emerald-500"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-widest">
                  Ваша вага (кг)
                </label>
                <input
                  type="number"
                  className="w-full p-6 bg-emerald-50 border-2 border-emerald-500 rounded-3xl font-black text-4xl text-center text-emerald-900 outline-none"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              {bmiValue && (
                <div className="pt-6 flex flex-col items-center">
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
                  <p
                    className="text-3xl font-black mt-2 transition-all"
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
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-500 text-left">
              <h2 className="text-3xl font-black text-center">Обмеження</h2>
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scroll">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase ml-2 tracking-widest">
                    Дієти
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
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selectedRestrictions.includes(d.id) ? "border-emerald-500 bg-emerald-50" : "border-slate-50 bg-slate-50"}`}
                      >
                        <span className="text-xl">{d.icon}</span>
                        <span className="text-[11px] font-black text-slate-700">
                          {d.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase ml-2 tracking-widest">
                    Алергени
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
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 text-center ${selectedRestrictions.includes(a.id) ? "border-rose-400 bg-rose-50" : "border-slate-50 bg-slate-50 hover:border-slate-100"}`}
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
            </div>
          )}

          {step === 9 && (
            <div className="flex flex-col flex-1 animate-in fade-in duration-500 h-full text-left">
              <h2 className="text-3xl font-black text-center mb-6">
                База інгредієнтів
              </h2>

              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Пошук інгредієнтів"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F7F9FC] p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-2 custom-scroll">
                {loading ? (
                  <div className="text-center py-10 animate-pulse font-black text-slate-300">
                    ЗАВАНТАЖЕННЯ...
                  </div>
                ) : (
                  <>
                    {!searchTerm && Object.keys(manualChanges).length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase ml-2 mb-3 tracking-widest">
                          Ваші збережені налаштування
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(manualChanges).map(([code, data]) => {
                            const status =
                              typeof data === "object" ? data.status : data;
                            const name =
                              typeof data === "object"
                                ? data.name
                                : `Код: ${code}`;
                            const brand =
                              typeof data === "object" ? data.brand : "";

                            return (
                              <div
                                key={code}
                                onClick={() =>
                                  toggleStatus({ code, name, brand })
                                }
                                className="flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 border-emerald-500 bg-emerald-50/30"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${status === "allow" ? "bg-emerald-500" : status === "limit" ? "bg-yellow-400" : "bg-orange-500"}`}
                                  >
                                    {status === "allow"
                                      ? "✓"
                                      : status === "limit"
                                        ? "—"
                                        : "✕"}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-[15px] leading-tight">
                                      {name}
                                    </span>
                                    {brand && (
                                      <span className="text-[9px] text-gray-400 uppercase font-black">
                                        {brand}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="h-[1px] bg-slate-100 my-6" />
                      </div>
                    )}

                    {products.map((p) => {
                      const data = manualChanges[p.code];
                      const status =
                        typeof data === "object"
                          ? data.status
                          : data || "allow";
                      const displayName = (
                        p.product_name_uk ||
                        p.product_name ||
                        "Невідомий продукт"
                      ).replace(/&quot;/g, '"');

                      return (
                        <div
                          key={p.code}
                          onClick={() => toggleStatus(p)}
                          className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${status !== "allow" ? "border-emerald-500 bg-emerald-50/30" : "border-gray-100 bg-slate-50/50"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${status === "allow" ? "bg-emerald-500" : status === "limit" ? "bg-yellow-400" : "bg-orange-500"}`}
                            >
                              {status === "allow"
                                ? "✓"
                                : status === "limit"
                                  ? "—"
                                  : "✕"}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-[15px] leading-tight">
                                {displayName}
                              </span>
                              <span className="text-[10px] text-gray-400 uppercase font-black mt-0.5">
                                {p.brands}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!loading && searchTerm && products.length === 0 && (
                      <div className="text-center py-10 font-bold text-slate-400 italic">
                        Нічого не знайдено...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto pt-8">
            <button
              onClick={handleFinalSave}
              className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-emerald-600 transition-all uppercase tracking-[0.2em] italic"
            >
              Зберегти всі зміни
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
