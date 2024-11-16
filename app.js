// Import necessary modules
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Retrieve environment variables (GitHub token, Session ID, Phone Number)
const githubToken = process.env.GITHUB_TOKEN;
const sessionId = process.env.SESSION_ID;
const phoneNumber = process.env.PHONE_NUMBER;

// Initialize WhatsApp client using LocalAuth for session persistence
const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId }), // Using session ID to persist sessions
    puppeteer: {
        headless: true,
    },
});

// When WhatsApp client is ready
client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

// Listen for incoming messages
client.on('message', (message) => {
    console.log(`Message received: ${message.body}`);

    // Command: .menu - Show available commands
    if (message.body === '.menu') {
        message.reply('Bot commands:\n.alive - Check if the bot is alive\n.song - Download songs from YouTube\n.yt - Download videos from YouTube\n.ai - Use AI commands\n.game - Play mini-games');
    } 

    // Command: .alive - Check if the bot is alive
    else if (message.body === '.alive') {
        message.reply('Bot is alive! 🎉');
    }

    // Command: .song - Download songs from YouTube
    else if (message.body.startsWith('.song')) {
        message.reply('Downloading song... 🎵');
        // Add your song download logic here
    }

    // Command: .yt - Download YouTube video
    else if (message.body.startsWith('.yt')) {
        message.reply('Downloading video... 🎬');
        // Add your YouTube video download logic here
    }

    // Command: .ai - AI functionality (e.g., chat with AI)
    else if (message.body.startsWith('.ai')) {
        message.reply('AI is processing your request...');
        // Add your AI logic here
    }

    // Command: .game - Play mini games
    else if (message.body.startsWith('.game')) {
        message.reply('Starting mini game...');
        // Add your mini-game logic here
    }
});

// Start WhatsApp client
client.initialize();

// GitHub API route to get user info using the GitHub Token
app.get('/github', async (req, res) => {
    try {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${githubToken}`,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('GitHub API request failed');
    }
});

// Serve static files from the 'public' folder (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Start Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
