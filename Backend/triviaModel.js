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
        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "deepseek",
            prompt: `${SYSTEM_PROMPT}\nUser: ${message}\nAI: `,
            stream: false
        });

        return response.data.response.trim();
    } catch (error) {
        console.error("Error calling DeepSeek R1:", error.message);
        return "Oops! The trivia master is taking a nap. Try again.";
    }
}

module.exports = { askDeepSeek };
