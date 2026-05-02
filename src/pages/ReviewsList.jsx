import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Оновлена SVG Іконка Зірочки
const StarIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "#F59E0B" : "#E2E8F0"}
    className="w-5 h-5 transition-all duration-300"
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      clipRule="evenodd"
    />
  </svg>
);

const ReviewsList = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("https://lifescan-23ke.onrender.com/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Помилка завантаження відгуків:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const totalReviews = reviews.length;

  const averageRating = totalReviews
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : "0.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating || 5) === star).length;
    const percentage = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percentage };
  });

  const getSortedReviews = () => {
    const sorted = [...reviews];
    if (sortBy === "newest") {
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sortBy === "best") {
      return sorted.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }
    if (sortBy === "worst") {
      return sorted.sort((a, b) => (a.rating || 5) - (b.rating || 5));
    }
    return sorted;
  };
  
  const handleLeaveReview = () => {
  const user = localStorage.getItem("user");
  
  if (user) {
    // Якщо користувач авторизований, одразу ведемо на /profile
    navigate("/profile");
  } else {
    // Якщо ні — ведемо на логін, передаючи в state початкову точку призначення
    navigate("/login", { state: { from: "/profile" } });
  }
};

  const sortedReviews = getSortedReviews();

  return (
    <div className="min-h-screen bg-slate-50/80 p-6 md:p-12 font-sans text-slate-900 relative overflow-hidden">
      {/* Декоративне розмиття на фоні */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[130px] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* ХЕДЕР */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 mb-4 text-slate-400 hover:text-emerald-600 transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              ← Повернутися на головну
            </button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Відгуки про Life<span className="text-emerald-500">Scan</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-2">
              Враження наших користувачів
            </p>
          </div>

          <button
  onClick={handleLeaveReview}
  className="px-6 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-slate-200/50 hover:shadow-emerald-100 cursor-pointer flex items-center gap-2 hover:-translate-y-0.5"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
  Залишити свій відгук
</button>
        </div>

        {/* СТАТИСТИКА ВІДГУКІВ */}
        {!loading && reviews.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            
            {/* Лівий блок: Середній бал */}
            <div className="flex flex-col items-center justify-center text-center md:border-r border-slate-100 md:pr-16 w-full md:w-auto">
              <span className="text-7xl font-black text-slate-900 leading-none">
                {averageRating}
              </span>
              <div className="flex items-center gap-0.5 my-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} filled={i < Math.round(averageRating)} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {totalReviews} {totalReviews === 1 ? "відгук" : totalReviews > 1 && totalReviews < 5 ? "відгуки" : "відгуків"}
              </span>
            </div>

            {/* Правий блок: Прогрес-бари */}
            <div className="flex-1 w-full space-y-3">
              {ratingDistribution.map((item) => (
                <div key={item.star} className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                  <span className="w-3 text-right">{item.star}</span>
                  <StarIcon filled={true} />

                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>

                  <span className="w-10 text-right text-slate-400 font-bold text-xs">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ФІЛЬТРИ СОРТУВАННЯ */}
        {!loading && reviews.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto py-1 select-none">
            {[
              { id: "newest", label: "🔥 Найновіші" },
              { id: "best", label: "⭐ Найкращі" },
              { id: "worst", label: "👎 Найгірші" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                  sortBy === tab.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200/60"
                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* СІТКА З ВІДГУКАМИ */}
        {loading ? (
          <div className="text-center py-20 animate-pulse">
            <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">
              Завантаження відгуків...
            </span>
          </div>
        ) : sortedReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 items-stretch">
            {sortedReviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:border-emerald-200/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} filled={i < (rev.rating || 5)} />
                    ))}
                  </div>
                  <p className="text-slate-700 font-normal text-[15px] leading-relaxed mb-6 break-words">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100/60">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm uppercase flex-shrink-0 border border-emerald-100/50">
                    {rev.email ? rev.email[0].toUpperCase() : "U"}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                      {rev.email ? rev.email.split("@")[0] : "Анонім"}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 tracking-wider inline-block mt-0.5">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("uk-UA") : "Нещодавно"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-medium text-base">
              Відгуків поки немає. Будьте першими!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;