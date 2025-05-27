const express = require('express');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const vault_address = process.env.VAULT_ADDRESS;
const vault_token = process.env.VAULT_TOKEN;
const VAULT_PATH = 'secret/data/api-keys'; // KV v2 path format

// Middleware: API secret verification
app.use((req, res, next) => {
  const apiSecret = req.headers['x-api-secret'];
  if (apiSecret !== process.env.MASTER_API_SECRET) {
    return res.status(403).json({ error: "Forbidden: Invalid API secret" });
  }
  next();
});

// API Route to generate and store API Key
app.get('/generate-api-key', async (req, res) => {
  const apiKey = uuidv4();

  try {
    const response = await axios.post(
      `${vault_address}/v1/${VAULT_PATH}`,
      {
        data: {
          key: apiKey,
          created_at: new Date().toISOString(),
        },
      },
      {
        headers: {
          'X-Vault-Token': vault_token,
        },
      }
    );

    res.json({
      success: true,
      message: "✅ API key generated and stored securely.",
      data: { key: apiKey },
    });

  } catch (error) {
    console.error('🧱 Vault Error Response:', error.response?.data);
    console.error('📦 Vault Status Code:', error.response?.status);
    console.error('🛠 Full Error Object:', error.toJSON?.() || error);

    res.status(500).json({
      success: false,
      message: '❌ Error storing key in Vault',
      vaultError: error.response?.data || error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
