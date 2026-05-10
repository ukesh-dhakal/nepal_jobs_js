const express = require('express');
const path = require('path');
const { scrapeAllCompanies, scrapeCompany, COMPANIES } = require('./scraper');
const { startNotifier } = require('./notifier');

const app = express();
const PORT = 3000;

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API: all companies
app.get('/api/jobs', async (req, res) => {
  const results = await scrapeAllCompanies();
  res.json({ companies: results });
});

// API: single company
app.get('/api/jobs/:name', async (req, res) => {
  const company = COMPANIES.find(c =>
    c.name.toLowerCase().replace(/\s/g,'') === req.params.name.toLowerCase().replace(/\s/g,'')
  );
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(await scrapeCompany(company));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Nepal Jobs Scanner → http://localhost:${PORT}`);
  startNotifier();
});
