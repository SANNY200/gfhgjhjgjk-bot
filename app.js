const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

// Body parser middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));

// Environment variables for WhatsApp Business API
const accessToken = process.env.ACCESS_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

// Endpoint for receiving WhatsApp messages
app.post('/whatsapp', (req, res) => {
  const incomingMessage = req.body.Body.toLowerCase();
  
  // WhatsApp API send message
  const sendMessage = (message) => {
    const messagePayload = {
      messaging_product: "whatsapp",
      to: req.body.From,
      text: { body: message },
    };
    
    axios.post(`https://graph.facebook.com/v14.0/${phoneNumberId}/messages`, messagePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      console.log('Message sent successfully:', response.data);
    })
    .catch(error => {
      console.error('Error sending message:', error.response.data);
    });
  };
  
  // Bot responses
  if (incomingMessage.includes('hello')) {
    sendMessage('Hello! How can I assist you today?');
  } else if (incomingMessage.includes('bye')) {
    sendMessage('Goodbye! Have a nice day!');
  } else {
    sendMessage('I didn’t understand that. Please say "hello" to start.');
  }
  
  res.send('OK');
});

// Start the server
app.listen(port, () => {
  console.log(`WhatsApp bot listening at http://localhost:${port}`);
});
