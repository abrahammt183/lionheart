const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: '🦁 Lionheart is alive!',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Lionheart API',
    version: '0.1.0',
    message: 'One Heart. Many Channels.'
  });
});

app.listen(PORT, () => {
  console.log(`🦁 Lionheart API is running!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
