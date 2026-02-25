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

        // ปรับปรุง System Prompt ให้กระชับและชัดเจนขึ้น เพื่อลดโอกาสภาษาเพี้ยน
        const messagesToSend = [
            { 
                role: "system", 
                content: "คุณคือผู้ช่วยภาษาไทยที่สุภาพ ถ้าผู้ใช้พิมพ์ไทยให้ตอบไทยและลงท้ายด้วย 'ครับ' เสมอ ถ้าพิมพ์อังกฤษให้ตอบอังกฤษแบบสุภาพโดยไม่ต้องลงท้ายด้วย 'ครับ' และห้ามตอบเป็นภาษาอื่นที่ผู้ใช้ไม่ได้ใช้งาน"
            },
            ...history, 
            { role: "user", content: message }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messagesToSend,
                temperature: 0.6, // ลดค่าความสุ่มลงเพื่อให้ AI ตอบแม่นยำขึ้น ไม่มโนเอง
                max_tokens: 1024,
                top_p: 1
            })
        });

        const data = await response.json();
        
        // ตรวจสอบ Error จาก API โดยตรง
        if (data.error) {
            console.error("Groq API Error:", data.error);
            return res.json({ reply: "❌ AI มึนงงชั่วคราว กรุณาลองใหม่ครับ" });
        }

        const reply = data.choices?.[0]?.message?.content || "⚠️ AI ไม่ตอบกลับครับ";
        res.json({ reply });
    } catch (err) {
        console.error("Server Crash:", err);
        res.json({ reply: "⚠️ ระบบขัดข้องครับ" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server Fixed & Online`));
