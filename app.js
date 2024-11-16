const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

// WhatsApp API සදහා පරිසර විචල්‍යයන්
const accessToken = process.env.ACCESS_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

let activeGames = {};  // පරිශීලකයින් සඳහා ක්‍රියාත්මක ක්‍රීඩා track කිරීම

app.use(bodyParser.urlencoded({ extended: false }));

// WhatsApp පණිවිඩ යැවීමේ ක්‍රියාවලිය
const sendMessage = (to, message) => {
  axios.post(`https://graph.facebook.com/v14.0/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: to,
    text: { body: message },
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    console.log('පණිවිඩය සාර්ථකව යවන්න:', response.data);
  })
  .catch(error => {
    console.error('පණිවිඩය යවීමට දෝෂයක්:', error.response.data);
  });
};

// .menu විධානය සහ අනෙකුත් විධාන
app.post('/whatsapp', (req, res) => {
  const incomingMessage = req.body.Body.toLowerCase();
  const sender = req.body.From;

  // .menu විධානය
  if (incomingMessage === '.menu') {
    const menuMessage = `
      *Mini-Games & Utilities Bot වෙත සාදරයෙන් පිළිගනිමු!*

      ඔබට භාවිතා කළ හැකි විධාන මෙසේය:

      1. *ක්‍රීඩා විධාන*:
         - .game start: සංඛ්‍යානුවාද ක්‍රීඩාව ආරම්භ කරන්න.
         - .game rps: Rock-Paper-Scissors ක්‍රීඩාව බොට් සමඟ ක්‍රීඩා කරන්න.
         - .game trivia: Trivia ප්‍රශ්න මඟින් ක්‍රීඩා කරන්න.

      2. *බාගත කිරීමේ විධාන*:
         - .yt download: YouTube වීඩියෝ එකක් බාගත කරන්න.
         - .sound: සංගීත ගීත හෝ ආලේපන ගොනු බාගත කරන්න.

      3. *AI විධාන*:
         - .ai prompt: AI එකක් භාවිතා කර ප්‍රතිචාර ලබා ගන්න.

      4. *අනෙකුත් විධාන*:
         - .help: ක්‍රීඩා කරන ආකාරය සහ උපදෙස් ලබා ගන්න.

      කරුණාකර ඔබට අවශ්‍ය විධානය වර්ගය ටයිප් කරන්න!
    `;
    sendMessage(sender, menuMessage);
  }
  // සංඛ්‍යානුවාද ක්‍රීඩාව ආරම්භ කිරීම
  else if (incomingMessage === '.game start') {
    activeGames[sender] = {
      targetNumber: Math.floor(Math.random() * 100) + 1, // 1 සහ 100 අතර ආ randomly සංඛ්‍යාව
      attempts: 0,
    };
    sendMessage(sender, 'Number Guessing Game එකට සාදරයෙන් පිළිගනිමු! 1 සහ 100 අතර සංඛ්‍යා එකක් අනුමාන කරන්න.');
  }
  // Rock-Paper-Scissors ක්‍රීඩාව
  else if (incomingMessage === '.game rps') {
    sendMessage(sender, 'කරුණාකර: rock, paper, හෝ scissors තෝරන්න.');
  }
  // Trivia ක්‍රීඩා විධානය (Placeholder)
  else if (incomingMessage === '.game trivia') {
    sendMessage(sender, 'Trivia ක්‍රීඩාව ඉක්මනින් ලැබෙනවා! කනගාටුයි.');
  }
  // YouTube වීඩියෝ බාගත කිරීම (Placeholder)
  else if (incomingMessage === '.yt download') {
    sendMessage(sender, 'කරුණාකර YouTube වීඩියෝ ලින්ක් එක යවන්න.');
    // මෙහි YouTube බාගත කිරීමේ ක්‍රියාවලිය එකතු කළ හැක.
  }
  // සංගීත හෝ ඵලවාසී ගොනු බාගත කිරීම (Placeholder)
  else if (incomingMessage === '.sound') {
    sendMessage(sender, 'කරුණාකර ගීතය හෝ ගොනුවේ නම එවන්න.');
    // සංගීත බාගත කිරීමේ ක්‍රියාවලිය (e.g. YouTube to MP3 API එකක් භාවිතා කිරීම).
  }
  // AI ප්‍රෝම්ප් විධානය (AI භාවිතා කිරීම)
  else if (incomingMessage === '.ai prompt') {
    sendMessage(sender, 'කරුණාකර AI එකට ප්‍රෝම්ප් එකක් ලබා දෙන්න.');
    // OpenAI GPT භාවිතා කරන්න.
  }
  // දෝෂ සහිත විධාන හෝ උදව්
  else {
    sendMessage(sender, 'ඔබට ".menu" විධානය එවමින් භාවිතා කළ හැකි විධාන බලන්න.');
  }

  res.send('OK');
});

// සේවාදායකය ආරම්භ කිරීම
app.listen(port, () => {
  console.log(`WhatsApp බොට් Mini-Games සහ Utilities සමඟ http://localhost:${port} තුළ සෙවීම.`);
});
