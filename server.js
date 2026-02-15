import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const result = await model.generateContent(
      `ตอบเป็นภาษาไทยเสมอ และใช้คำลงท้ายว่า ครับ เท่านั้น\n\n${message}`
    );

    const reply = result.response.text();
    res.json({ reply });

   } catch (error) {
    console.error("🔥 AI ERROR:", error.message);

    if (error.message.includes("429")) {
      return res.json({
        reply: "⚠️ วันนี้ AI ใช้ครบโควต้าแล้ว ลองใหม่พรุ่งนี้นะครับ"
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
