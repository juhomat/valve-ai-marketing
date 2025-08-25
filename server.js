const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Valve AI Marketing server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
