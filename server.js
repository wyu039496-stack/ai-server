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
        const { message, history } = req.body;
        const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;

        if (!apiKey) return res.json({ reply: "⚠️ ไม่พบ API KEY ครับ" });

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
                        content: "คุณคือผู้ช่วยที่ตอบเป็นภาษาไทยอย่างสุภาพและลงท้ายด้วย 'ครับ' เสมอ หากผู้ใช้คุยภาษาอังกฤษให้ตอบภาษาอังกฤษที่สุภาพโดยไม่ต้องลงท้ายด้วย 'ครับ' ห้ามตอบด้วยภาษาอื่น"
                    },
                    ...history, 
                    { role: "user", content: message }
                ],
                temperature: 0.5 // เน้นความแม่นยำของภาษา
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "⚠️ AI มึนงงชั่วคราวครับ";
        res.json({ reply });
    } catch (err) {
        res.json({ reply: "⚠️ เกิดข้อผิดพลาดในระบบครับ" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));
