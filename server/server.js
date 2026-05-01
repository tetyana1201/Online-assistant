require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const translate = require("@iamtraction/google-translate");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 1200,
  },
});
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB підключено!"))
  .catch((err) => console.error("❌ Помилка підключення:", err.message));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    goal: String,
    experience: String,
    gender: String,
    userType: String,
    weight: Number,
    height: Number,
    age: Number,
    bmi: Number,
    bmr: Number,
    restrictions: [String],
    manualChanges: Object,
  },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const scanHistorySchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  barcode: String,
  productName: String,
  ingredients: [{ name: String, status: String, reason: String }],
  verdict: String,
  calories: Number,
  risks: [String],
  createdAt: { type: Date, default: Date.now },
});
const ScanHistory = mongoose.model("ScanHistory", scanHistorySchema);

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, profile } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email вже зайнятий" });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      password: hashedPassword,
      profile,
    });

    await newUser.save();
    res.status(201).json({ message: "Користувача створено" });
  } catch {
    res.status(500).json({ message: "Помилка реєстрації" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Невірні дані" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Невірні дані" });
    }

    res.json({
      message: "Вхід успішний",
      user: { email: user.email, profile: user.profile },
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

app.post("/api/update-profile", async (req, res) => {
  try {
    const { email, profile } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { profile } },
      { new: true },
    );
    if (!updatedUser)
      return res.status(404).json({ message: "Користувача не знайдено" });
    res.json({ message: "Успішно оновлено", user: updatedUser });
  } catch {
    res.status(500).json({ message: "Помилка оновлення профілю" });
  }
});

app.post("/api/scan-product", async (req, res) => {
  try {
    const { barcode, imageText, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    let productName = "Невідомий продукт";
    let rawIngredients = [];
    let calories = 0;

    if (barcode) {
      try {
        const offRes = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        );
        const offData = await offRes.json();
        if (offData.status === 1) {
          productName = offData.product.product_name || productName;
          rawIngredients =
            offData.product.ingredients_tags?.map((t) =>
              t.replace("en:", "").replace(/-/g, " "),
            ) ||
            offData.product.ingredients_text?.split(",").map((i) => i.trim()) ||
            [];
          calories = offData.product.nutriments?.["energy-kcal_100g"] || 0;
        }
      } catch {
        console.log("OFF недоступний");
      }
    }

    if (rawIngredients.length === 0) {
      try {
        const prompt = `Ти — експерт з харчування. Проаналізуй дані: 
        Штрих-код: ${barcode || "не розпізнано"}
        Текст з фото: ${imageText || "відсутній"}

        Поверни ТІЛЬКИ JSON:
        {
          "productName": "Назва",
          "ingredients": ["інгредієнт 1"],
          "calories": 100
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response
          .text()
          .trim()
          .replace(/```json|```/g, "");
        const aiData = JSON.parse(text);

        productName = aiData.productName || "Невідомий продукт";
        rawIngredients = aiData.ingredients || [];
        calories = aiData.calories || 0;
      } catch (aiError) {
        console.error("Gemini Error:", aiError);

        const isQuotaError =
          aiError.message?.includes("429") || aiError.status === 429;

        productName = isQuotaError
          ? "Ліміт запитів вичерпано"
          : "Продукт не розпізнано";
        calories = 0;
        rawIngredients = [
          isQuotaError
            ? "Зачекайте 60 секунд. Безкоштовний ліміт ШІ закінчився."
            : "Не вдалося розпізнати склад. Спробуйте ще раз.",
        ];
      }
    }

    const restrictions = user.profile?.restrictions || [];

    const allergenKeywords = {
      peanuts: ["арахіс", "peanut", "арахис"],
      eggs: ["яйц", "egg"],
      fish: ["риб", "fish"],
      shellfish: ["молюск", "shellfish", "креветк", "shrimp", "prawn"],
      tree_nuts: [
        "горіх",
        "nut",
        "мигдал",
        "almond",
        "фундук",
        "hazelnut",
        "кеш",
        "cashew",
        "walnut",
      ],
      soy: ["соя", "soy"],
      wheat: ["пшени", "wheat", "глютен", "gluten", "борошн", "flour"],
      milk: [
        "молоко",
        "milk",
        "лактоз",
        "lactose",
        "вершк",
        "cream",
        "сир",
        "cheese",
      ],
    };

    const dietRestrictions = {
      lactose_free: [
        "молоко",
        "лактоз",
        "вершк",
        "сир",
        "йогурт",
        "milk",
        "lactose",
        "cream",
      ],
      gluten_free: [
        "пшени",
        "житн",
        "ячм",
        "глютен",
        "wheat",
        "gluten",
        "rye",
        "barley",
      ],
      keto: [
        "цукор",
        "мед",
        "рис",
        "картоп",
        "борошн",
        "sugar",
        "rice",
        "flour",
      ],
      gerd: [
        "томат",
        "лимон",
        "апельсин",
        "м'ят",
        "шоколад",
        "кава",
        "гостри",
        "tomato",
        "coffee",
        "mint",
      ],
      low_fodmap: [
        "цибул",
        "часник",
        "яблук",
        "мед",
        "квасол",
        "onion",
        "garlic",
        "honey",
      ],
      anti_inf: [
        "цукор",
        "маргарин",
        "пальм",
        "sugar",
        "palm oil",
        "margarine",
      ],
    };

    const detailedIngredients = await Promise.all(
      rawIngredients.map(async (item) => {
        let name = item.replace(/^RU:/i, "").trim();

        try {
          const translated = await translate(name, { to: "uk" });
          name = translated.text;
        } catch {
          console.error("Помилка перекладу:", name);
        }

        let status = "can_eat";
        let reason = "Безпечно для вашого профілю";

        const lowerName = name.toLowerCase();
        const lowerOriginal = item.toLowerCase();

        let foundAllergen = null;
        for (const restrictionId of restrictions) {
          const keywords = allergenKeywords[restrictionId];
          if (
            keywords &&
            keywords.some(
              (key) => lowerName.includes(key) || lowerOriginal.includes(key),
            )
          ) {
            foundAllergen = restrictionId;
            break;
          }
        }

        if (foundAllergen) {
          status = "avoid";
          reason = `Містить алерген: ${foundAllergen}`;
        } else {
          for (const dietId of restrictions) {
            const forbidden = dietRestrictions[dietId];
            if (
              forbidden &&
              forbidden.some(
                (word) =>
                  lowerName.includes(word) || lowerOriginal.includes(word),
              )
            ) {
              status = "avoid";
              reason = `Не підходить для обраної дієти/обмеження`;
              break;
            }
          }
        }

        const userGoal = user.profile.goal;

        if (status === "can_eat") {
          if (userGoal === "weight") {
            const highCalorieKeys = [
              "цукор",
              "сироп",
              "маргарин",
              "пальм",
              "фруктоз",
              "sugar",
            ];
            if (highCalorieKeys.some((key) => lowerName.includes(key))) {
              status = "limit";
              reason =
                "Високий вміст доданих цукрів або жирів (небажано для контролю ваги)";
            } else if (calories > 400) {
              status = "limit";
              reason = "Висока енергетична цінність продукту";
            }
          } else if (userGoal === "safety") {
            const safetyRisks = [
              "глутамат",
              "нітрит",
              "бензоат",
              "барвник",
              "консервант",
              "сорбінова",
              "пальм",
              "маргарин",
              "ароматизатор",
              "емульгатор",
              "антиоксидант",
              "фермент",
            ];

            const ePattern = /[EeЕе]\d{1,6}/;

            const hasRiskWord = safetyRisks.some(
              (key) => lowerName.includes(key) || lowerOriginal.includes(key),
            );
            const hasECode =
              ePattern.test(lowerOriginal) || ePattern.test(lowerName);

            if (hasRiskWord || hasECode) {
              status = "limit";
              reason =
                "Містить добавки, які варто вживати з обережністю при виборі безпечних продуктів";
            }
          } else if (userGoal === "allergy") {
            const hiddenAllergens = [
              "ароматизатор",
              "спеції",
              "натуральні добавки",
            ];
            if (hiddenAllergens.some((key) => lowerName.includes(key))) {
              status = "limit";
              reason =
                "Склад містить загальні компоненти, які можуть приховувати алергени";
            }
          } else if (userGoal === "ingredients") {
            const complexKeys = [
              "модифікований",
              "емульгатор",
              "стабілізатор",
              "згущувач",
              "ароматизатор",
              "гідрогенізований",
            ];

            const ePattern = /[EeЕе]\s?\d{1,6}/;

            const hasComplexWord = complexKeys.some(
              (key) => lowerName.includes(key) || lowerOriginal.includes(key),
            );
            const hasECode =
              ePattern.test(lowerOriginal) || ePattern.test(lowerName);

            if (hasComplexWord || hasECode) {
              status = "limit";
              reason = "Складний інгредієнт, що потребує детального вивчення";
            }
          }
        }

        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          status,
          reason,
        };
      }),
    );

    let finalVerdict = "can_eat";
    if (detailedIngredients.some((i) => i.status === "avoid"))
      finalVerdict = "avoid";
    else if (detailedIngredients.some((i) => i.status === "limit"))
      finalVerdict = "limit";

    const history = await ScanHistory.create({
      userEmail: email,
      barcode,
      productName,
      ingredients: detailedIngredients,
      verdict: finalVerdict,
      calories: Math.round(calories),
    });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка сканування" });
  }
});

app.get("/api/history/:email", async (req, res) => {
  try {
    const history = await ScanHistory.find({
      userEmail: req.params.email,
    }).sort({ createdAt: -1 });
    res.json(history);
  } catch {
    res.status(500).json({ message: "Помилка історії" });
  }
});

app.delete("/api/history/delete/:id", async (req, res) => {
  try {
    await ScanHistory.findByIdAndDelete(req.params.id);
    res.json({ message: "Запис видалено" });
  } catch {
    res.status(500).json({ message: "Помилка видалення" });
  }
});

app.delete("/api/history/clear/:email", async (req, res) => {
  try {
    await ScanHistory.deleteMany({ userEmail: req.params.email });
    res.json({ message: "Вся історія очищена" });
  } catch {
    res.status(500).json({ message: "Помилка очищення" });
  }
});

app.post("/api/ai-assistant/chat", async (req, res) => {
  try {
    const { message, userProfile, history } = req.body;

    const prompt = `Ти — персональний нутриціолог LifeScan. 
Відповідай тільки чистим текстом українською мовою, без JSON, без markdown, без зайвих символів.

Дані користувача:
- Ціль: ${userProfile?.goal || "не вказано"}
- Вік: ${userProfile?.age || "—"} | Зріст: ${userProfile?.height || "—"} | Вага: ${userProfile?.weight || "—"}
- ІМТ: ${userProfile?.bmi || "—"}
- Метаболізм: ${userProfile?.bmr || "—"}
- Обмеження: ${userProfile?.restrictions?.join(", ") || "немає"}

Останні сканування: ${
      history
        ?.slice(0, 3)
        .map((h) => h.productName)
        .join(", ") || "немає"
    }

Запит користувача: "${message}"

Дай коротку, корисну та дружню відповідь (2-4 речення).`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    res.json({ text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res
      .status(500)
      .json({ message: "ШІ тимчасово недоступний. Спробуй пізніше." });
  }
});

app.get("/api/test-gemini", async (req, res) => {
  try {
    const result = await model.generateContent(
      "Привіт! Скажи 'Gemini працює чудово!' українською мовою.",
    );
    res.json({ success: true, answer: result.response.text() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const chatMessageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ["user", "ai"] },
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  title: String,
  createdAt: { type: Date, default: Date.now },
});

const ChatHistory = mongoose.model("ChatHistory", chatMessageSchema);

app.post("/api/ai-chat/save", async (req, res) => {
  try {
    const { userEmail, messages, chatId } = req.body;

    const firstUserMsg =
      messages.find((m) => m.role === "user")?.text || "Нова розмова";
    const title =
      firstUserMsg.length > 40
        ? firstUserMsg.substring(0, 37) + "..."
        : firstUserMsg;

    let chat;

    if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
      chat = await ChatHistory.findByIdAndUpdate(
        chatId,
        { $set: { messages } },
        { new: true },
      );
    } else {
      chat = new ChatHistory({
        userEmail,
        messages,
        title,
      });
      await chat.save();
    }

    res.json({ success: true, chatId: chat._id });
  } catch (error) {
    console.error("Save Chat Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Помилка збереження чату" });
  }
});

app.get("/api/ai-chat/history/:email", async (req, res) => {
  try {
    const chats = await ChatHistory.find({ userEmail: req.params.email }).sort({
      createdAt: -1,
    });
    res.json(chats);
  } catch {
    res.status(500).json([]);
  }
});

app.delete("/api/ai-chat/delete/:id", async (req, res) => {
  try {
    await ChatHistory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Сервер запущено на порту ${PORT}`));
