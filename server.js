import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();              // ✅ ต้องมีบรรทัดนี้
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ เช็ก API KEY ตอน start
console.log(
  "🔑 GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "OK" : "MISSING"
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateWithRetry(prompt, retry = 3) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    if (err.status === 429 && retry > 0) {
      console.log("⏳ โควต้าเต็ม รอ 5 วิ...");
      await new Promise(r => setTimeout(r, 5000));
      return generateWithRetry(prompt, retry - 1);
    }
    throw err;
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message;
    if (!userMessage) {
      return res.json({ reply: "❌ ไม่มีข้อความส่งมา" });
    }

    const prompt = `
คุณคือแชทบอทภาษาไทย
- ใช้คำลงท้ายว่า "ครับ"
- ห้ามใช้ "ค่ะ"
- ตอบสุภาพ กระชับ

ผู้ใช้: ${userMessage}
`;

    const result = await generateWithRetry(prompt);
    const text = result?.response?.text?.();

    res.json({
      reply: text || "⚠️ AI ไม่ตอบกลับ"
    });

  } catch (err) {
    console.error("🔥 CHAT ERROR:", err);
    res.json({
      reply: "⚠️ ระบบขัดข้อง กรุณาลองใหม่ครับ"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
