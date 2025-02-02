const express = require("express");
const cors = require("cors");
const { askDeepSeek } = require("./triviaModel");

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

let sessions = {}; // Stores player progress

// 🟢 Greet user and ask for categories
app.get("/start", (req, res) => {
    const sessionId = req.query.sessionId || "default";
    sessions[sessionId] = { score: 0, emojis: [] };

    res.json({
        message: "Oh look, another brave soul who thinks they can win at trivia. Choose 6 categories wisely, genius."
    });
});

// 🟢 Handle user responses
app.post("/ask", async (req, res) => {
    const { sessionId, message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const aiResponse = await askDeepSeek(message);

    res.json({ message: aiResponse });
});

// 🟢 Check game status
app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId || "default";
    res.json(sessions[sessionId] || { score: 0, emojis: [] });
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Trivia server running on http://localhost:${PORT}`);
});
