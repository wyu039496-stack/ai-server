app.post("/chat", async (req, res) => {
  try {
    console.log("📩 body:", req.body);

    // ❗ เช็ก API KEY ก่อน
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: "❌ ไม่พบ GEMINI_API_KEY ใน Render"
      });
    }

    const userMessage = req.body?.message;
    if (!userMessage) {
      return res.json({ reply: "❌ ไม่มีข้อความส่งมา" });
    }

    const systemPrompt = `
คุณคือแชทบอทภาษาไทย
- ใช้คำลงท้ายว่า "ครับ"
- ห้ามใช้ "ค่ะ"
- ตอบสุภาพ กระชับ
`;

    const result = await generateWithRetry(
      systemPrompt + "\nผู้ใช้: " + userMessage
    );

    // ❗ กันกรณี Gemini ไม่ตอบ
    if (!result?.response?.text) {
      return res.json({ reply: "⚠️ AI ไม่ตอบกลับ" });
    }

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
