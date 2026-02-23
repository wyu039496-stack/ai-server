import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// แก้ __dirname สำหรับ ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // ต้องสร้าง app ก่อน
const PORT = process.env.PORT || 3000; // Render จะกำหนด Port ให้เองผ่าน Environment Variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// middleware
app.use(cors()); // วางไว้หลัง const app
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================
// CHAT API
// =========================
app.post("/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const userMessage = req.body.message;

    // เปลี่ยนจาก gemini-2.5-pro (ซึ่งอาจยังไม่มี) เป็น gemini-1.5-flash หรือ pro ที่เสถียรกว่า
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: userMessage }] }
          ]
        })
      }
    );

    const data = await response.json();

    // เพิ่มการดักจับกรณี API ส่ง Error กลับมา
    if (data.error) {
        console.error("Gemini Error:", data.error.message);
        return res.json({ reply: "⚠️ AI แจ้งข้อผิดพลาด: " + data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI ไม่ตอบกลับ";
    res.json({ reply });

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.json({ reply: "⚠️ ระบบขัดข้อง กรุณาลองใหม่ครับ" });
  }
});

// =========================
// START
// =========================
app.listen(PORT, () => {
  console.log(`✅ Server running → Port ${PORT}`);
});