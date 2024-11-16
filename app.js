// Required packages
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp client
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

// Generate QR code
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan it using WhatsApp.');
});

// WhatsApp ready state
client.on('ready', () => {
    console.log('WhatsApp bot SANNUU MD is ready!');
});

// Message handler
client.on('message', async (msg) => {
    if (!msg?.body?.startsWith('!')) return;

    const [command, ...args] = msg.body.split(' ');
    switch (command.toLowerCase()) {
        case '!help':
            return msg.reply(
                '*🤖 SANNUU MD Commands:*\n\n' +
                '!help - Show this message\n' +
                '!ping - Check bot status\n' +
                '!time - Get current time\n' +
                '!sticker - Convert image to sticker\n' +
                '!echo <message> - Echo your message\n'
            );

        case '!ping':
            return msg.reply('🏓 Pong! SANNUU MD is active.');

        case '!time':
            const currentTime = new Date().toLocaleString();
            return msg.reply(`🕒 Current time: *${currentTime}*`);

        case '!sticker':
            if (!msg.hasMedia) {
                return msg.reply('❌ Please send an image with the !sticker command.');
            }
            const media = await msg.downloadMedia();
            return media
                ? msg.reply('✅ Sticker created!', { media, sendMediaAsSticker: true })
                : msg.reply('❌ Failed to create sticker.');

        case '!echo':
            if (!args.length) {
                return msg.reply('❌ Please provide a message to echo.');
            }
            const message = args.join(' ');
            return msg.reply(`🔊 Echo: ${message}`);
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
    res.send('SANNUU MD bot is running!');
});
app.listen(port, () => console.log(`Server running on port ${port}`));
