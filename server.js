import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;

        if (!apiKey) return res.json({ reply: "⚠️ ไม่พบ API KEY" });

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        // เพิ่มคำสั่งให้ลงท้ายด้วย "ครับ" เสมอ
                        content: "คุณคือผู้ช่วยภาษาไทยที่แสนใจดี ตอบสุภาพ และต้องลงท้ายด้วยคำว่า 'ครับ' ในทุกๆ ประโยคหรือทุกๆ คำตอบเสมอ" 
                    },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "⚠️ AI ไม่ตอบกลับ";
        res.json({ reply });
    } catch (err) {
        res.json({ reply: "⚠️ ระบบขัดข้อง: " + err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
