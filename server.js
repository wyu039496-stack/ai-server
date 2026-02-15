import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateWithRetry(prompt, retry = 3) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    if (err.status === 429 && retry > 0) {
      console.log("Quota เต็ม รอ 5 วิ...");
      await new Promise(r => setTimeout(r, 5000));
      return generateWithRetry(prompt, retry - 1);
    }
    throw err;
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const systemPrompt = `
คุณคือแชทบอทภาษาไทย
- ใช้คำลงท้ายว่า "ครับ" เท่านั้น
- ห้ามใช้ "ค่ะ"
- ตอบสุภาพ กระชับ เข้าใจง่าย
`;

    const result = await generateWithRetry(
      systemPrompt + "\nผู้ใช้: " + userMessage
    );

    res.json({
      reply: result.response.text()
    });

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
  console.log("Server running on port", PORT);
});
