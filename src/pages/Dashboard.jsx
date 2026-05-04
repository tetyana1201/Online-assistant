import { Html5QrcodeScanner } from "html5-qrcode";
import Tesseract from "tesseract.js";
import { Link } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import Quagga from "quagga";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [setHistory] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [imageText, setImageText] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const abortControllerRef = useRef(null);

  const preprocessImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width * 1.8;
        canvas.height = img.height * 1.8;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          const value = gray < 140 ? 0 : 255;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = URL.createObjectURL(file);
    });
  };
  const canvasRef = useRef(null);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    if (storedUser?.email) fetchHistory(storedUser.email);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setScanResult(null);
    setBarcode("");
    setImageText("");
    setOcrStatus("");

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);

    setIsCameraActive(false);

    setIsProcessing(true);
    setOcrStatus("");

    try {
      const processedImage = await preprocessImage(file);

      const {
        data: { text },
      } = await Tesseract.recognize(processedImage, "ukr+eng", {
        logger: (m) => console.log(m),
      });
      const cleanedText = text.trim().replace(/\s+/g, " ");
      setImageText(cleanedText);

      const img = new Image();
      img.src = processedImage;
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        Quagga.decodeSingle(
          {
            src: canvas.toDataURL(),
            numOfWorkers: 4,
            locate: true,
            decoder: {
              readers: ["ean_reader", "ean_8_reader", "code_128_reader"],
            },
          },
          (result) => {
            const detectedBarcode = result?.codeResult?.code || "";
            setBarcode(detectedBarcode);
            handleScan(detectedBarcode, cleanedText);
            setOcrStatus("");
          },
        );
        event.target.value = "";
      };
    } catch (err) {
      console.error(err);
      setOcrStatus("Помилка обробки");
      setIsProcessing(false);
    }
  };

  const fetchHistory = (email) => {
    fetch(`https://lifescan-23ke.onrender.com/api/history/${email}`)
      .then((res) => res.json())
      .then((data) => setHistory(data));
  };
const clearPreview = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

    setPreviewImage(null);
    setBarcode("");
    setImageText("");
    setScanResult(null);
    setOcrStatus("");
    setIsCameraActive(false);
    setIsProcessing(false);
  };

useEffect(() => {
    if (previewImage) return;

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 280, height: 280 },
      aspectRatio: 1.0,
    });

    scanner.render(
      (text) => {
        setBarcode(text);
      },
      () => {},
    );

    const localizedLabels = {
      "Request Camera Permissions": "Надати дозвіл на камеру",
      "Requesting camera permissions...": "Запит дозволу на камеру...",
      "Scan an Image File": "Сканувати з файлу",
      "Scan using camera directly": "Сканувати камерою",
      "Choose Image - No image choosen": "Обери зображення",
      "Stop Scanning": "Зупинити сканування",
      "Start Scanning": "Почати сканування",
      "Select Camera": "Обери камеру",
      "Or drop an image to scan": "Або перетягни файл сюди"
    };

    const translateScannerUI = () => {
        const elements = document.querySelectorAll("#reader button, #reader span, #reader div, #reader a, #reader option, #reader label");
        elements.forEach((el) => {
          el.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.nodeValue?.trim();
              
              if (!text) return;

              if (localizedLabels[text]) {
                node.nodeValue = localizedLabels[text];
              } 
              else if (text.startsWith("Select Camera")) {
                node.nodeValue = text.replace("Select Camera", "Обери камеру");
              }
              else if (text.includes("Stop Scanning")) {
                node.nodeValue = text.replace("Stop Scanning", "Зупинити сканування");
              }
              else if (text.includes("Start Scanning")) { 
                node.nodeValue = text.replace("Start Scanning", "Почати сканування");
              }
            }
          });
        });
      };

    const translationInterval = setInterval(translateScannerUI, 100);

    const checkVideoInterval = setInterval(() => {
      const video = document.querySelector("#reader video");
      if (video && video.readyState >= 2) {
        setIsCameraActive(true);
      } else {
        setIsCameraActive(false);
      }
    }, 500);

    const interceptFileInput = () => {
    const fileInput = document.querySelector('#reader input[type="file"]');
    if (fileInput) {
      const newFileInput = fileInput.cloneNode(true);
      fileInput.parentNode.replaceChild(newFileInput, fileInput);

      newFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          console.log("Файл обрано через внутрішню кнопку сканера");
          
          const fakeEvent = {
            target: {
              files: [e.target.files[0]],
              value: ""
            }
          };
          handleFileUpload(fakeEvent);
        }
      });
    }
  };

  const interceptInterval = setInterval(interceptFileInput, 500);

  return () => {
    clearInterval(translationInterval);
    clearInterval(checkVideoInterval);
    clearInterval(interceptInterval); 
    scanner.clear().catch((err) => console.error(err));
  };
}, [user, previewImage]);

  const handleScan = async (code, text) => {
  if (!user?.email) return;

  setIsProcessing(true);
  abortControllerRef.current = new AbortController();
  const { signal } = abortControllerRef.current;

  let productName = "Невідомий продукт";
  let rawIngredients = [];
  let calories = 0;
  let fetchedFromOFF = false;

  const currentBarcode = code || barcode;

  if (currentBarcode) {
    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${currentBarcode}.json`,
        {
          headers: {
            "User-Agent": "FoodSurveyTest/1.0-dev (tatyana.dev@gmail.com)",
            "Accept": "application/json"
          },
          signal
        }
      );

      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1) {
          productName = offData.product.product_name || productName;
          rawIngredients =
            offData.product.ingredients_tags?.map((t) =>
              t.replace("en:", "").replace(/-/g, " ")
            ) ||
            offData.product.ingredients_text?.split(",").map((i) => i.trim()) ||
            [];
          calories = offData.product.nutriments?.["energy-kcal_100g"] || 0;
          fetchedFromOFF = true;
          console.log("Успішно отримано з OFF на фронтенді");
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Помилка запиту до OFF на фронтенді:", err);
      }
    }
  }

  try {
    const res = await fetch("https://lifescan-23ke.onrender.com/api/scan-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        barcode: currentBarcode,
        imageText: text || imageText,
        email: user.email,
        offData: fetchedFromOFF ? { productName, rawIngredients, calories } : null
      }),
    });

    const data = await res.json();

    const manualEntry = user?.profile?.manualChanges?.[currentBarcode];
    const manualStatus =
      manualEntry && typeof manualEntry === "object"
        ? manualEntry.status
        : manualEntry;

    let finalVerdict = data.verdict;

    if (data.verdict !== "avoid") {
      if (manualStatus && manualStatus !== "allow") {
        finalVerdict = manualStatus;
      }
    }

    setScanResult({
      ...data,
      verdict: finalVerdict,
      barcode: currentBarcode,
      productName: data.productName
        ? data.productName.replace(/&quot;/g, '"')
        : data.productName,
    });

    fetchHistory(user.email);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Запит було скасовано користувачем.");
    } else {
      console.error("Помилка при аналізі продукту:", err);
    }
  } finally {
    setIsProcessing(false);
  }
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans selection:bg-emerald-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">
              Life<span className="text-emerald-500">Scan</span>
            </h1>
            <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-xs">
              Твій інтелектуальний онлайн-помічник
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/history"
              className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                🕒
              </span>
              <span className="text-sm font-bold text-slate-700">Історія</span>
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

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>

            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-800 relative z-10 uppercase tracking-tight">
              <span className="p-3 bg-emerald-100 rounded-2xl">📸</span>
              Сканувати штрихкод
            </h2>

            <div
              id="reader"
              className="rounded-[2rem] overflow-hidden border-4 border-slate-50 bg-slate-50 mb-8 shadow-inner"
            ></div>
            {previewImage ? (
  <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50 bg-slate-50 mb-8 shadow-inner flex items-center justify-center relative p-4 animate-in fade-in duration-300">
    <img
      src={previewImage}
      alt="Scan Preview"
      className="object-contain max-h-[350px] w-full rounded-2xl transition-transform hover:scale-102 duration-300"
    />
    <button
      onClick={clearPreview}
      className="absolute top-4 right-4 bg-slate-900/80 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-lg"
    >
      ✕ Очистити фото
    </button>
  </div>
) : (
  <div id="reader" className="rounded-[2rem] overflow-hidden border-4 border-slate-50 bg-slate-50 mb-8 shadow-inner"></div>
)}

            <div className="mb-6">
              <label className="flex items-center justify-center w-full py-4 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-all text-emerald-700 font-bold">
                <span className="font-bold uppercase text-xs tracking-widest">
                  {isProcessing && ocrStatus
                    ? `⏳ ${ocrStatus}`
                    : "📁 Завантажити фото"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {(isProcessing || (isCameraActive && !previewImage)) && (
  <button
    onClick={() => {
      const video = document.querySelector("#reader video");
      if (video) {
        setIsProcessing(true);
        setOcrStatus("Роблю фото...");

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "manual_snap.png", {
              type: "image/png",
            });
            handleFileUpload({ target: { files: [file] } });
          }
        });
      }
    }}
    disabled={isProcessing}
    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 animate-in fade-in duration-300 ${
      isProcessing
        ? "bg-slate-700 text-slate-300 cursor-not-allowed"
        : "bg-slate-900 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-slate-200"
    }`}
  >
    {isProcessing ? "Аналізую..." : "Сфотографувати та проаналізувати"}
  </button>
)}
          </div>
        </div>

        {isProcessing && !scanResult && (
          <div className="max-w-4xl mx-auto mt-12 animate-pulse">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100">
              <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
              <div className="h-12 w-2/3 bg-slate-200 rounded mb-8"></div>
              <div className="flex gap-4">
                <div className="h-10 w-32 bg-slate-100 rounded-full"></div>
                <div className="h-10 w-32 bg-slate-100 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="max-w-4xl mx-auto mt-12">
            {scanResult.productName === "Ліміт запитів вичерпано" ? (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-8 text-center animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-black text-amber-800 uppercase tracking-tight mb-2">
                  Ой, виникла помилка
                </h2>
                <p className="text-amber-700 font-medium">
                  Перевищено ліміт запитів. Спробуйте пізніше.
                </p>
                <div className="mt-6 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 animate-[loading_60s_linear]"></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white animate-in fade-in slide-in-from-bottom-10 duration-700 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-0"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                  <div>
                    <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                      Звіт аналізу
                    </p>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                      {scanResult.productName}
                    </h2>
                    <div className="flex items-center gap-2 bg-slate-50 w-fit px-4 py-2 rounded-full border border-slate-100">
                      <span className="text-sm font-bold text-slate-600 tracking-tight">
                        Енергетична цінність:{" "}
                        <span className="text-slate-900">
                          {scanResult.calories} ккал
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`px-12 py-6 rounded-[2rem] text-white font-black text-2xl shadow-2xl transition-transform hover:scale-105 duration-500 ${
                      scanResult.verdict === "avoid"
                        ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200"
                        : scanResult.verdict === "limit"
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200"
                          : "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-200"
                    }`}
                  >
                    {scanResult.verdict === "avoid"
                      ? "❌ НЕ ВЖИВАТИ"
                      : scanResult.verdict === "limit"
                        ? "⚠️ ОБМЕЖИТИ"
                        : "✅ БЕЗПЕЧНО"}
                  </div>
                </div>

                {(() => {
                  const analyzedBarcode = scanResult?.barcode;
                  if (!analyzedBarcode) return null;

                  const manualEntry =
                    user?.profile?.manualChanges?.[analyzedBarcode];
                  if (!manualEntry) return null;

                  const manualStatus =
                    typeof manualEntry === "object"
                      ? manualEntry.status
                      : manualEntry;

                  if (!manualStatus || manualStatus === "allow") return null;

                  const isAvoid = manualStatus === "avoid";

                  const bgColor = isAvoid ? "bg-rose-50" : "bg-amber-50";
                  const borderColor = isAvoid
                    ? "border-rose-500"
                    : "border-amber-500";
                  const textColor = isAvoid
                    ? "text-rose-700"
                    : "text-amber-700";
                  const titleColor = isAvoid
                    ? "text-rose-900"
                    : "text-amber-900";
                  const icon = isAvoid ? "☝️" : "⚠️";

                  const actionText = isAvoid
                    ? "небажаний (уникати)"
                    : "продукт для обмеження";

                  return (
                    <div className="relative z-10 mb-8 animate-in zoom-in duration-500 text-left">
                      <div
                        className={`${bgColor} border-l-4 ${borderColor} p-5 rounded-2xl flex items-start gap-4 shadow-sm`}
                      >
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <h4
                            className={`${titleColor} font-black uppercase text-[10px] tracking-wider mb-1`}
                          >
                            Ваш персональний вибір
                          </h4>
                          <p
                            className={`${textColor} text-sm font-medium leading-tight`}
                          >
                            Ви позначили цей продукт як{" "}
                            <span className="underline decoration-2 font-bold uppercase">
                              {actionText}
                            </span>{" "}
                            у налаштуваннях профілю.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-6 flex items-center gap-4">
                    Склад продукту{" "}
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </h3>
                  <div className="flex flex-wrap gap-4 text-left">
                    {scanResult.ingredients?.map((ing, idx) => (
                      <div key={idx} className="group relative">
                        <button
                          className={`px-6 py-3 rounded-[1.2rem] border-2 font-black text-xs uppercase transition-all hover:scale-105 active:scale-95 ${getStatusStyles(ing.status)}`}
                        >
                          {ing.name
                            .replace(/^RU:/i, "")
                            .toLowerCase()
                            .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
                        </button>
                        {ing.reason && (
                          <div className="absolute bottom-full mb-2 z-[100] left-0 w-max max-w-[250px] p-3 bg-slate-900 text-white text-[11px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 shadow-2xl translate-y-2 group-hover:translate-y-0 leading-relaxed">
                            <p className="text-emerald-400 mb-1 uppercase text-[9px] tracking-widest font-black">
                              Обґрунтування:
                            </p>
                            <div className="whitespace-normal break-words">
                              {ing.reason}
                            </div>

                            <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
