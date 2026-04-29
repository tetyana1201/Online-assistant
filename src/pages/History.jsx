import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [user] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const fetchHistory = (email) => {
    fetch(`http://localhost:5000/api/history/${email}`)
      .then((res) => res.json())
      .then(setHistory);
  };

  useEffect(() => {
    // Якщо після ініціалізації користувача немає — на логін
    if (!user) {
      navigate("/login");
    } else {
      // Якщо є — завантажуємо історію
      fetchHistory(user.email);
    }
  }, [navigate, user]); // Додаємо user у залежності

  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/&quot;/g, '"').replace(/&QUOT;/g, '"');
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "avoid":
        return "bg-rose-50 border-rose-200 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
      case "limit":
        return "bg-amber-50 border-amber-200 text-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
      default:
        return "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Видалити цей запис?")) return;
    await fetch(`http://localhost:5000/api/history/delete/${id}`, {
      method: "DELETE",
    });
    setHistory(history.filter((item) => item._id !== id));
  };

  const clearAll = async () => {
    if (!window.confirm("Видалити ВСЮ історію?")) return;
    await fetch(`http://localhost:5000/api/history/clear/${user.email}`, {
      method: "DELETE",
    });
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans selection:bg-emerald-100">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">
              Life<span className="text-emerald-500">Scan</span>
            </h1>
            <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-xs">
              Твій інтелектуальний нутрі-помічник
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                📸
              </span>
              <span className="text-sm font-bold text-slate-700">Сканер</span>
            </Link>

            <Link
              to="/aiassistant"
              className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-lg font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <span>✨</span> AI Помічник
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-100 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-bold text-slate-700">
                {user?.email || "Користувач"}
              </span>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              Архів перевірок
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearAll}
                className="bg-rose-50 text-rose-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
              >
                Очистити все
              </button>
            )}
          </div>

          <div className="grid gap-6">
            {history.map((item) => (
              <div
                key={item._id}
                className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedScan(item)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 pr-4">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl leading-tight mb-2">
                      {cleanText(item.productName)}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest">
                        {Math.round(item.calories)} ккал
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div
                      className={`w-4 h-4 rounded-full animate-pulse ${
                        item.verdict === "avoid"
                          ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                          : item.verdict === "limit"
                            ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                            : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      }`}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item._id);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all text-2xl font-light"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="py-32 text-center text-slate-300 italic font-medium">
                Тут поки порожньо...
              </div>
            )}
          </div>
        </div>

        {selectedScan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[3.5rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 pb-6 border-b border-slate-50 shrink-0">
                <button
                  onClick={() => setSelectedScan(null)}
                  className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-all text-3xl z-10"
                >
                  ×
                </button>

                <span
                  className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block ${
                    selectedScan.verdict === "avoid"
                      ? "bg-rose-100 text-rose-600"
                      : selectedScan.verdict === "limit"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {selectedScan.verdict === "avoid"
                    ? "❌ Результат: Уникати"
                    : selectedScan.verdict === "limit"
                      ? "⚠️ Результат: Обмежити"
                      : "✅ Результат: Безпечно"}
                </span>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2 pr-12">
                  {cleanText(selectedScan.productName)}
                </h2>
                <p className="text-slate-400 font-bold text-sm tracking-tight italic">
                  Виявлено {selectedScan.ingredients?.length || 0} ключових
                  компонентів
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-10 pt-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedScan.ingredients?.map((ing, i) => (
                    <div
                      key={i}
                      className={`p-6 rounded-[2rem] border-2 transition-all hover:scale-[1.02] ${getStatusStyles(ing.status)}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs">
                          {ing.status === "avoid"
                            ? "🔴"
                            : ing.status === "limit"
                              ? "🟡"
                              : "🟢"}
                        </span>
                        <p className="font-black text-xs uppercase tracking-wide">
                          {ing.name}
                        </p>
                      </div>
                      <p className="text-[11px] leading-relaxed font-bold opacity-80">
                        {ing.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-8 shrink-0 bg-gradient-to-t from-white to-transparent"></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default History;
