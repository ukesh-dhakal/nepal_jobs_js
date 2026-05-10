# 🇳🇵 Nepal Tech Job Scanner (Node.js)

Scrapes careers pages of major Nepal tech companies in real-time.

**Stack:** Node.js · Express · Axios · Cheerio · Vanilla JS

---

## 🚀 Setup & Run

```bash
# Install dependencies
npm install

# Run
node server.js

# Open browser at:
# http://localhost:3000
```

That's it. No venv, no Python issues.

---

## 🏢 Companies Tracked

Leapfrog, Fusemachines, Deerwalk, CloudFactory, F1Soft, Vianet, Subisu, InfoDevelopers, Wiseyak, Yomari, Verisk Nepal, Cotiviti Nepal

## ➕ Add More Companies

In `server.js`, add to the `COMPANIES` array:

```js
{ name: "Company", url: "https://company.com/careers", logo: "🚀", color: "#FF0000" }
```

## 📡 API

| Endpoint | Description |
|---|---|
| `GET /` | Web UI |
| `GET /api/jobs` | All companies |
| `GET /api/jobs/:name` | Single company |

---

> Built by Ukesh Dhakal — ukeshdhakal.com.np
