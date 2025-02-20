// server.js
import express from 'express';
import cors from 'cors';
import { Ollama } from 'ollama';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const ollama = new Ollama();

const systemPrompt = `You are a snarky trivia host. Follow these rules exactly:

1. Start by greeting and asking player to choose from these categories: History, Science, Pop Culture, Geography, Sports, Literature
2. After they choose categories, ask only ONE question at a time
3. Wait for their answer, then:
   - If correct: Give a sarcastic congratulation and award an emoji
   - If incorrect: Mock them gently and give the right answer
4. Then ask the next single question
5. Make questions progressively harder
6. Game ends after 5 correct answers (victory) or if player gives up

Format your responses exactly like this:
- For category selection: "[CATEGORIES] Pick 6 categories:"
- For a question: "[QUESTION] Your single question here"
- For correct answer: "[CORRECT] Your sarcastic praise + emoji"
- For wrong answer: "[INCORRECT] Your mocking response"
- For game end: "[GAME_OVER] Final message"

Important: Only ask ONE question at a time and wait for the answer!`;

function parseResponse(response, currentGameState) {
    const content = response.message.content;
    const newGameState = { ...currentGameState };

    if (content.includes('[CATEGORIES_SELECTED]')) {
        const categoryMatches = content.match(/\[([^\]]+)\]/g);
        if (categoryMatches) {
            const categories = categoryMatches
                .filter(cat => cat !== '[CATEGORIES_SELECTED]')
                .map(cat => cat.replace(/[\[\]]/g, ''));
            newGameState.categories = categories;
            newGameState.gameStarted = true;
        }
    }

    if (content.includes('[CORRECT]')) {
        newGameState.score += 1;
        const emojis = ['🌟', '🏆', '💫', '🎯', '🎮'];
        if (newGameState.emojis.length < 5) {
            newGameState.emojis.push(emojis[newGameState.emojis.length]);
        }
        newGameState.difficulty = Math.min(5, newGameState.difficulty + 1);
        newGameState.lastAnswer = 'correct';
    }

    if (content.includes('[INCORRECT]')) {
        newGameState.difficulty = Math.min(5, newGameState.difficulty + 1);
        newGameState.lastAnswer = 'incorrect';
    }

    if (content.includes('[GAME_OVER]') || newGameState.emojis.length >= 5) {
        newGameState.isGameOver = true;
    }

    const questionMatch = content.match(/\[QUESTION\](.*?)(\[|$)/s);
    if (questionMatch) {
        newGameState.currentQuestion = questionMatch[1].trim();
        newGameState.lastAnswer = null;
    }

    return newGameState;
}

app.post('/api/start-game', async (req, res) => {
    try {
        const initialMessage = {
            role: 'assistant',
            content: '[CATEGORIES] Pick 6 categories from: History, Science, Pop Culture, Geography, Sports, Literature'
        };

        res.json({
            response: initialMessage.content,
            gameState: {
                score: 0,
                emojis: [],
                categories: [],
                gameStarted: false,
                currentQuestion: null,
                difficulty: 1,
                isGameOver: false,
                lastAnswer: null
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, gameState } = req.body;

        const response = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'assistant', content: gameState.currentQuestion || '' },
                { role: 'user', content: message }
            ],
            stream: false
        });

        const updatedGameState = parseResponse(response, gameState);

        res.json({
            response: response.message.content,
            gameState: updatedGameState
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});