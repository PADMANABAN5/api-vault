const express = require('express');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const app = express();
const port = 3000;

const vault_address = process.env.VAULT_ADDRESS;
const vault_token = process.env.VAULT_TOKEN;
const VAULT_PATH = 'secret/data/api-keys';

// Protect all routes with API secret middleware
app.use((req, res, next) => {
  const apiSecret = req.headers['x-api-secret'];
  if (apiSecret !== process.env.MASTER_API_SECRET) {
    return res.status(403).json({ error: "Forbidden: Invalid API secret" });
  }
  next();
});

app.get('/generate-api-key', async (req, res) => {
  const apiKey = uuidv4();

  try {
    await axios.post(`${vault_address}/v1/${VAULT_PATH}`, {
      data: {
        key: apiKey,
        created_at: new Date().toISOString(),
      },
    }, {
      headers: {
        'X-Vault-Token': vault_token,
      },
    });

    res.json({ success: true, message: "API key generated and stored securely." });
  } catch (error) {
    console.error('Vault Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Error storing key in Vault' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
