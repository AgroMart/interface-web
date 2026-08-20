const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve static assets from Vue build directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for HTML5 History Mode routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`AgroMart Web server running on port ${port}`);
});
