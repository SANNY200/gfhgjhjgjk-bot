// app.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// GitHub token for authentication
const githubToken = process.env.GITHUB_TOKEN;

// Initialize WhatsApp client using LocalAuth for session persistence
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
    },
});

// When the WhatsApp client is ready
client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

// Listen for incoming messages
client.on('message', (message) => {
    // Respond to specific commands
    if (message.body === '.menu') {
        message.reply('Bot commands:\n.alive - Check if the bot is alive\n.song - Download songs from YouTube\n.yt - Download videos from YouTube\n.ai - Use AI commands\n.game - Play mini-games');
    } else if (message.body === '.alive') {
        message.reply('Bot is alive! 🎉');
    }
    // Add more commands as per your requirement
});

// Start the WhatsApp client
client.initialize();

// Express API to interact with GitHub using the Auth Token
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

// Static file hosting for any assets (optional)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
