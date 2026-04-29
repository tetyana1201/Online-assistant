import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const AIAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Привіт! Я твій онлайн-помічник. Запитай мене щось про твоє харчування або останні сканування.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    if (storedUser?.email) {
      loadChatHistory(storedUser.email);
    }
  }, []);

  const loadChatHistory = (email) => {
    fetch(`http://localhost:5000/api/ai-chat/history/${email}`)
      .then((res) => res.json())
      .then((data) => setChatHistory(data))
      .catch((err) => console.error(err));
  };

  const loadChat = (chat) => {
    setCurrentChatId(chat._id);
    setMessages(chat.messages || []);
  };

  const startNewChat = () => {
    setMessages([{ role: "ai", text: "Привіт! Чим можу допомогти зараз?" }]);
    setCurrentChatId(null);
    setInput("");
  };

  const clearAllChats = () => {
    if (!window.confirm("Видалити всю історію чатів?")) return;
    fetch(`http://localhost:5000/api/ai-chat/clear/${user.email}`, {
      method: "DELETE",
    })
      .then(() => {
        setChatHistory([]);
        startNewChat();
      })
      .catch((err) => console.error(err));
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const userMsg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userProfile: user.profile,
          history: [],
        }),
      });
      const data = await res.json();
      const aiMsg = {
        role: "ai",
        text: data.text || "Перевищено ліміт запитів. Спробуйте пізніше.",
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      const saveRes = await fetch("http://localhost:5000/api/ai-chat/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          messages: finalMessages,
          chatId: currentChatId,
        }),
      });
      const savedChat = await saveRes.json();
      if (savedChat.chatId) {
        setCurrentChatId(savedChat.chatId);
        loadChatHistory(user.email);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Помилка з’єднання." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Видалити?")) return;
    fetch(`http://localhost:5000/api/ai-chat/delete/${id}`, {
      method: "DELETE",
    }).then(() => {
      loadChatHistory(user.email);
      if (currentChatId === id) startNewChat();
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans p-2 md:p-6 text-left">
      <div className="max-w-[1400px] mx-auto h-[92vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 px-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-all"
          >
            <span className="text-xl">←</span>
            <span className="text-sm uppercase tracking-tight">
              Назад до сканера
            </span>
          </Link>

          <Link
            to="/profile"
            className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 hover:border-emerald-500 transition-all"
          >
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                Користувач
              </p>
              <p className="text-xs font-bold text-slate-800">{user?.email}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-emerald-200 uppercase">
              {user?.email?.[0]}
            </div>
          </Link>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="hidden lg:flex w-80 flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black uppercase tracking-tight text-lg text-slate-800">
                  Історія порад
                </h2>

                <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black">
                  {chatHistory.length}
                </span>
              </div>
              <button
                onClick={startNewChat}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-md active:scale-95 uppercase text-xs tracking-wider"
              >
                + Нова розмова
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {chatHistory.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => loadChat(chat)}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      currentChatId === chat._id
                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                        : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-xs font-black line-clamp-1 pr-4 ${currentChatId === chat._id ? "text-emerald-700" : "text-slate-700"}`}
                    >
                      {chat.title || "Нова розмова"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={(e) => deleteChat(chat._id, e)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {chatHistory.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={clearAllChats}
                    className="w-full text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-all"
                  >
                    Видалити всі чати
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                ✨
              </div>
              <div>
                <h1 className="font-black uppercase tracking-widest text-lg leading-none">
                  LifeScan Assistant
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                    AI Online • На основі профілю
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-[#F8FAFC] custom-scrollbar">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-5 rounded-[1.8rem] text-[15px] shadow-sm border-2 ${
                      m.role === "user"
                        ? "bg-slate-800 text-white border-slate-800 rounded-tr-none font-medium"
                        : "bg-white text-slate-800 border-white rounded-tl-none font-bold leading-relaxed"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-bounce">
                  <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
                    ШІ думає...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-200">
              <div className="max-w-4xl mx-auto relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Запитайте про склад, калорії або поради..."
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-[2rem] px-8 py-5 pr-20 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-[1.5rem] font-black transition-all shadow-md active:scale-90"
                >
                  ➔
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-black">
                ШІ використовує дані про ваш ІМТ та алергени
              </p>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `,
        }}
      />
    </div>
  );
};

export default AIAssistant;
