const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { askDeepSeek, startGame } = require('./triviaModel');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

let gameState = {
    categories: [],
    score: 0,
    emojis: [],
    currentQuestion: null,
    level: 1, // Tracks question difficulty
};

// Start the game and explain the rules
app.get('/start', async (req, res) => {
    try {
        const response = await startGame();
        res.json({ response });
    } catch (error) {
        console.error('Error starting the game:', error);
        res.status(500).json({ message: 'Oops! The trivia master is taking a nap. Try again.' });
    }
});

// Set categories
app.post('/set-categories', (req, res) => {
    const { categories } = req.body;
    if (categories.length !== 6) {
        return res.status(400).json({
            message: 'Choose exactly 6 categories or face the wrath of trivia sarcasm.',
        });
    }
    gameState.categories = categories;
    res.json({ message: `Great! Your categories are: ${categories.join(', ')}. Ready for your first question?` });
});

// Ask a question (using Ollama to generate it)
app.post('/ask', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        const response = await askDeepSeek(message);
        res.json({ response });
    } catch (error) {
        console.error('Error processing AI response:', error);
        res.status(500).json({ message: 'Oops! The trivia master is taking a nap. Try again.' });
    }
});

// Submit an answer
app.post('/submit-answer', async (req, res) => {
    const { answer } = req.body;

    // Check answer via Ollama
    try {
        const response = await askDeepSeek(answer);
        if (response.toLowerCase().includes('correct')) {
            gameState.score++;
            gameState.emojis.push('🎉');
            gameState.level++;
            res.json({
                message: `Correct! You earned an emoji! 🎉 Current score: ${gameState.score}. Ready for the next one?`,
            });
        } else {
            res.json({
                message: `Wrong! No emoji for you. 😏 The answer was probably obvious... Next question?`,
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error checking the answer' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});