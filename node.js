const axios = require('axios');

// WhatsApp Business API Access Token සහ Phone Number ID
const accessToken = 'your_access_token';  // Your Facebook access token
const phoneNumberId = 'your_phone_number_id';  // Your WhatsApp Business phone number ID
const toPhoneNumber = 'whatsapp:+your_receiver_number';  // Phone number to send message to

// Send WhatsApp message payload
const messagePayload = {
  messaging_product: "whatsapp",
  to: toPhoneNumber,
  text: { body: 'Hello, this is your WhatsApp bot!' },
};

// WhatsApp API Call
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
