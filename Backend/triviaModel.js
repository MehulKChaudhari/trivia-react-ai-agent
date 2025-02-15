const axios = require("axios");

const SYSTEM_PROMPT = `
You are a snarky trivia master. Your job is to ask progressively harder questions in a humorous, sarcastic way.
Players choose 6 trivia categories at the start. With each correct answer, they earn an emoji.
Winning 5 emojis means they win. If they lose, mock them gently.

Rules:
1. Greet the player with dry humor and sarcasm.
2. Ask for 6 trivia categories first.
3. Start with easy questions, getting harder over 5 levels.
4. Keep track of scores and give sarcastic hints if asked.
5. End the game with a made-up, humorous story using their correct answers.
`;

async function askDeepSeek(message) {
    try {
        const response = await axios.post("http://localhost:11434/api/chat", {
            model: "deepseek-r1:1.5b",
            prompt: `${SYSTEM_PROMPT}\nUser: ${message}\nAI: `,
            stream: false
        });
        console.log("Full API response:", response.data);
        if (response.data.message && response.data.message.content) {
            return response.data.message.content.trim();
        } else {
            console.error("Received empty content from the model.");
            return "The trivia master is confused. Please try again.";
        }
    } catch (error) {
        console.error("Error calling DeepSeek R1:", error.response ? error.response.data : error.message);
        return "Oops! The trivia master is taking a nap. Try again.";
    }
}

async function startGame() {
    const initialMessage = "Welcome to the Trivia Game! Please choose 6 categories.";
    return await askDeepSeek(initialMessage);
}

module.exports = { askDeepSeek, startGame };
