// Required packages
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp client with proper error handling
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'bot-session',
        dataPath: './whatsapp-sessions'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        timeout: 60000  // Increased timeout to 60 seconds
    },
    qrMaxRetries: 5,  // Maximum QR code regeneration attempts
    restartOnAuthFail: true  // Automatically restart on auth failure
});

// Error-proof command handler
const handleCommand = async (msg) => {
    try {
        const chat = await msg.getChat();
        const sender = await msg.getContact();
        
        // Get command and arguments with error checking
        if (!msg.body) {
            return;  // Ignore empty messages
        }
        
        const [command, ...args] = msg.body.split(' ');
        
        switch (command.toLowerCase()) {
            case '!help':
                return msg.reply(
                    '*🤖 Available Commands:*\n\n' +
                    '!help - Show this message\n' +
                    '!ping - Check bot status\n' +
                    '!info - Get chat info\n' +
                    '!weather <city> - Get weather info\n' +
                    '!sticker - Convert image to sticker\n' +
                    '!echo <message> - Bot repeats your message\n' +
                    '!flip - Flip a coin\n' +
                    '!roll - Roll a dice\n' +
                    '!time - Get current time\n' +
                    '!clear - Clear chat (groups only)\n'
                ).catch(err => console.error('Error sending help message:', err));

            case '!ping':
                return msg.reply('🏓 Pong!')
                    .catch(err => console.error('Error sending ping response:', err));

            case '!info':
                try {
                    const chatInfo = `
*Chat Information:*
Chat Name: ${chat?.name || 'Private Chat'}
Chat Type: ${chat?.isGroup ? 'Group' : 'Private'}
${chat?.isGroup ? `Members: ${chat.participants?.length || 'Unknown'}` : ''}
Messages Today: ${await countTodayMessages(chat)}`;
                    return msg.reply(chatInfo);
                } catch (error) {
                    console.error('Error getting chat info:', error);
                    return msg.reply('❌ Error getting chat information');
                }

            case '!weather':
                if (!args.length) {
                    return msg.reply('❌ Please specify a city. Example: !weather London');
                }
                try {
                    const city = args.join(' ');
                    const weather = await getWeather(city);
                    return msg.reply(weather);
                } catch (error) {
                    console.error('Weather error:', error);
                    return msg.reply('❌ Error getting weather information');
                }

            case '!sticker':
                if (!msg.hasMedia) {
                    return msg.reply('❌ Please send an image with the !sticker command');
                }
                try {
                    const media = await msg.downloadMedia();
                    if (!media) {
                        return msg.reply('❌ Failed to download media');
                    }
                    return chat.sendMessage(media, { sendMediaAsSticker: true });
                } catch (error) {
                    console.error('Sticker error:', error);
                    return msg.reply('❌ Error creating sticker');
                }

            case '!echo':
                if (!args.length) {
                    return msg.reply('❌ Please provide a message to echo');
                }
                const message = args.join(' ').slice(0, 1000); // Limit message length
                return msg.reply(message)
                    .catch(err => console.error('Error sending echo:', err));

            case '!flip':
                try {
                    const coin = Math.random() < 0.5 ? 'Heads' : 'Tails';
                    return msg.reply(`🪙 Coin flip result: *${coin}*`);
                } catch (error) {
                    console.error('Flip error:', error);
                    return msg.reply('❌ Error flipping coin');
                }

            case '!roll':
                try {
                    const dice = Math.floor(Math.random() * 6) + 1;
                    return msg.reply(`🎲 Dice roll result: *${dice}*`);
                } catch (error) {
                    console.error('Roll error:', error);
                    return msg.reply('❌ Error rolling dice');
                }

            case '!time':
                try {
                    const time = new Date().toLocaleString();
                    return msg.reply(`🕒 Current time: *${time}*`);
                } catch (error) {
                    console.error('Time error:', error);
                    return msg.reply('❌ Error getting current time');
                }

            case '!clear':
                if (!chat?.isGroup) {
                    return msg.reply('❌ This command only works in groups');
                }
                try {
                    await clearChat(chat);
                    return msg.reply('✅ Chat cleared!');
                } catch (error) {
                    console.error('Clear error:', error);
                    return msg.reply('❌ Error clearing chat');
                }
        }
    } catch (error) {
        console.error('Command handler error:', error);
        return msg.reply('❌ An unexpected error occurred').catch(() => {});
    }
};

// Improved helper functions with better error handling
async function countTodayMessages(chat) {
    try {
        if (!chat) throw new Error('Invalid chat object');
        
        const messages = await chat.fetchMessages({ limit: 100 });
        if (!Array.isArray(messages)) return 'Unknown';
        
        const today = new Date().setHours(0, 0, 0, 0);
        return messages.filter(msg => msg?.timestamp * 1000 >= today).length;
    } catch (error) {
        console.error('Count messages error:', error);
        return 'Unknown';
    }
}

async function getWeather(city) {
    try {
        if (!city) throw new Error('City is required');
        
        // Add your weather API implementation here
        // For now, return mock data with error handling
        return `🌤️ Weather for ${city}:\nTemperature: 22°C\nCondition: Sunny`;
    } catch (error) {
        console.error('Weather fetch error:', error);
        throw new Error('Weather service unavailable');
    }
}

async function clearChat(chat) {
    try {
        if (!chat?.isGroup) throw new Error('Invalid chat object or not a group');
        
        const messages = await chat.fetchMessages({ limit: 100 });
        if (!Array.isArray(messages)) throw new Error('Failed to fetch messages');
        
        await Promise.allSettled(
            messages.map(message => 
                message?.delete(true).catch(err => 
                    console.error(`Failed to delete message: ${err.message}`)
                )
            )
        );
    } catch (error) {
        console.error('Clear chat error:', error);
        throw new Error('Failed to clear chat');
    }
}

// Improved message handler with retry logic
client.on('message', async (msg) => {
    if (!msg?.body?.startsWith('!')) return;

    let retries = 3;
    while (retries > 0) {
        try {
            await handleCommand(msg);
            break;
        } catch (error) {
            console.error(`Command failed (${retries} retries left):`, error);
            retries--;
            if (retries === 0) {
                await msg.reply('❌ Command failed after multiple attempts')
                    .catch(() => console.error('Failed to send error message'));
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
    }
});

// Enhanced error handlers
client.on('auth_failure', async (msg) => {
    console.error('Authentication failed:', msg);
    // Implement reconnection logic if needed
    setTimeout(() => client.initialize(), 5000);
});

client.on('disconnected', async (reason) => {
    console.log('Client was disconnected:', reason);
    // Attempt to reconnect
    setTimeout(() => client.initialize(), 5000);
});

// Initialize client with error handling
const initializeClient = async () => {
    try {
        await client.initialize();
    } catch (error) {
        console.error('Failed to initialize client:', error);
        // Retry initialization after 5 seconds
        setTimeout(initializeClient, 5000);
    }
};

// Start server with error handling
const startServer = () => {
    try {
        app.get('/', (req, res) => {
            res.send('Bot is running!');
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        }).on('error', (error) => {
            console.error('Server error:', error);
            // Retry starting server with a different port
            if (error.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying ${port + 1}`);
                app.listen(port + 1);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        // Retry starting server after 5 seconds
        setTimeout(startServer, 5000);
    }
};

// Improved process error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
    // Implement error reporting or recovery logic here
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Implement error reporting or recovery logic here
});

// Start the application
initializeClient();
startServer();
