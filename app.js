// Required packages
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { exec } = require('child_process');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp client with session handling
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.SESSION_ID || 'bot-session',
        dataPath: './whatsapp-sessions'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        timeout: 60000
    },
    qrMaxRetries: 5,
    restartOnAuthFail: true
});

// Generate QR code if needed
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan it using WhatsApp.');
});

// WhatsApp ready state
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

// Message handler
client.on('message', async (msg) => {
    if (!msg?.body?.startsWith('!')) return;

    const [command, ...args] = msg.body.split(' ');
    switch (command.toLowerCase()) {
        case '!help':
            return msg.reply(
                '*🤖 Available Commands:*\n\n' +
                '!help - Show this message\n' +
                '!ping - Check bot status\n' +
                '!weather <city> - Get weather info\n' +
                '!sticker - Convert image to sticker\n'
            );

        case '!ping':
            return msg.reply('🏓 Pong!');

        case '!weather':
            if (!args.length) {
                return msg.reply('❌ Please specify a city. Example: !weather London');
            }
            try {
                const city = args.join(' ');
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
                const { main, weather } = response.data;
                return msg.reply(`🌤️ Weather for ${city}:\nTemperature: ${main.temp}°C\nCondition: ${weather[0].description}`);
            } catch (error) {
                console.error('Weather error:', error);
                return msg.reply('❌ Error fetching weather data');
            }

        case '!sticker':
            if (!msg.hasMedia) {
                return msg.reply('❌ Please send an image with the !sticker command');
            }
            const media = await msg.downloadMedia();
            return media
                ? msg.reply('✅ Sticker created!', { media, sendMediaAsSticker: true })
                : msg.reply('❌ Failed to create sticker');
    }
});

// Auth failure or disconnection handling
client.on('auth_failure', (msg) => console.error('Authentication failed:', msg));
client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
    setTimeout(() => client.initialize(), 5000); // Reconnect after 5 seconds
});

// Initialize client
client.initialize();

// Start server
app.get('/', (req, res) => {
    res.send('Bot is running!');
});
app.listen(port, () => console.log(`Server running on port ${port}`));

// Optional Git integration for cloning a repository
if (process.env.GIT_USER && process.env.GIT_TOKEN && process.env.GIT_REPO) {
    const gitUrl = `https://${process.env.GIT_USER}:${process.env.GIT_TOKEN}@github.com/${process.env.GIT_USER}/${process.env.GIT_REPO}.git`;
    exec(`git clone ${gitUrl}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error cloning repo: ${error.message}`);
        } else {
            console.log(`Repo cloned successfully:\n${stdout}`);
        }
    });
}
