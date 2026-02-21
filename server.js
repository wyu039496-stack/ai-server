import express from "express";
import fs from "fs";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MEMORY_FILE = "./memory.json";
const ADMIN_KEY = "admin123";

// ===== Memory =====
let memory = {};
if (fs.existsSync(MEMORY_FILE)) {
  memory = JSON.parse(fs.readFileSync(MEMORY_FILE));
} else {
  fs.writeFileSync(MEMORY_FILE, "{}");
}

// ===== Gemini =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not found");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ โมเดลที่ถูกต้อง
const model = genAI.getGenerativeModel({
  model: "gemini-1.0-pro"
});

async function generateAI(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ===== CHAT =====
app.post("/chat", async (req, res) => {
  try {
    const msg = req.body?.message?.trim();
    if (!msg) {
      return res.json({ reply: "❌ ไม่มีข้อความส่งมา" });
    }

    // ตอบจากความจำก่อน
    if (memory[msg]) {
      return res.json({ reply: memory[msg] });
    }

    const systemPrompt = `
คุณคือแชทบอทภาษาไทย
- ใช้คำลงท้ายว่า "ครับ"
- ห้ามใช้ "ค่ะ"
- ตอบสุภาพ กระชับ
`;

    const reply = await generateAI(
      systemPrompt + "\nผู้ใช้: " + msg
    );

    // จำคำตอบ
    memory[msg] = reply;
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

    res.json({ reply });

  } catch (err) {
    console.error("🔥 CHAT ERROR FULL:", err);
    res.json({
      reply: "⚠️ ระบบขัดข้อง กรุณาลองใหม่ครับ"
    });
  }
});

// ===== ADMIN TEACH =====
app.post("/teach", (req, res) => {
  const { question, answer, key } = req.body;

  if (key !== ADMIN_KEY) {
    return res.status(403).json({ msg: "❌ ไม่ใช่แอดมิน" });
  }

  if (!question || !answer) {
    return res.json({ msg: "❌ ข้อมูลไม่ครบ" });
  }

  memory[question.trim()] = answer.trim();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

  res.json({ msg: "✅ บอทเรียนรู้แล้ว" });
});

app.get("/", (req, res) => {
  res.send("🤖 AI Server running");
});

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
