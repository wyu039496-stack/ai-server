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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ ใช้โมเดลที่รองรับแน่นอน
const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

async function generateWithRetry(prompt) {
  const result = await model.generateContent(prompt);
  return result;
}

// ===== CHAT =====
app.post("/chat", async (req, res) => {
  try {
    const msg = req.body?.message?.trim();
    if (!msg) {
      return res.json({ reply: "❌ ไม่มีข้อความส่งมา" });
    }

    // ถ้ามีใน memory
    if (memory[msg]) {
      return res.json({ reply: memory[msg] });
    }

    const systemPrompt = `
คุณคือแชทบอทภาษาไทย
- ใช้คำลงท้ายว่า "ครับ"
- ห้ามใช้ "ค่ะ"
- ตอบสุภาพ กระชับ
`;

    const result = await generateWithRetry(
      systemPrompt + "\nผู้ใช้: " + msg
    );

    const reply = result.response.text();

    // จำคำตอบ
    memory[msg] = reply;
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

    res.json({ reply });

  } catch (err) {
    console.error("🔥 CHAT ERROR:", err.message);
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

  memory[question.trim()] = answer.trim();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

  res.json({ msg: "✅ บอทเรียนรู้แล้ว" });
});

app.get("/", (req, res) => {
  res.send("🤖 AI Server running");
});

app.listen(PORT, () => {
  console.log("🚀 Server started on", PORT);
});
