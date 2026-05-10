// scraper.js — shared scraping logic
const axios = require('axios');
const cheerio = require('cheerio');

const COMPANIES = [
  { name: "Leapfrog Technology", url: "https://www.lftechnology.com/careers/",        logo: "🐸", color: "#00C896" },
  { name: "Fusemachines",        url: "https://fusemachines.com/careers/",             logo: "🤖", color: "#FF4444" },
  { name: "Deerwalk",            url: "https://www.deerwalk.com/careers/",             logo: "🦌", color: "#8B5CF6" },
  { name: "CloudFactory",        url: "https://www.cloudfactory.com/careers",          logo: "☁️", color: "#F59E0B" },
  { name: "F1Soft",              url: "https://f1soft.com/career/",                    logo: "💳", color: "#10B981" },
  { name: "Vianet",              url: "https://www.vianet.com.np/career",              logo: "🌐", color: "#3B82F6" },
  { name: "Subisu",              url: "https://subisu.net.np/career.php",              logo: "📡", color: "#EF4444" },
  { name: "InfoDevelopers",      url: "https://infodevelopers.com.np/career/",         logo: "💻", color: "#F97316" },
  { name: "Wiseyak",             url: "https://wiseyak.com/careers/",                  logo: "🧠", color: "#6366F1" },
  { name: "Yomari",              url: "https://yomari.com/careers/",                   logo: "🍡", color: "#EC4899" },
  { name: "Verisk Nepal",        url: "https://www.verisk.com/careers/",               logo: "📊", color: "#14B8A6" },
  { name: "Cotiviti Nepal",      url: "https://www.cotiviti.com/careers/job-listings", logo: "💡", color: "#0066CC" },
  { name: "Sagarmatha Technologies", url: "https://sagarmathtech.com/careers/", logo: "🏔️", color: "#FF9933" }  ,
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const JOB_KEYWORDS = [
  'engineer','developer','intern','manager','analyst','designer',
  'devops','cloud','qa','tester','architect','lead','senior',
  'junior','associate','consultant','administrator','officer',
  'specialist','coordinator','support','network','system'
];

function resolveUrl(href, baseUrl) {
  try {
    if (!href) return baseUrl;
    if (href.startsWith('http')) return href;
    const base = new URL(baseUrl);
    if (href.startsWith('/')) return `${base.protocol}//${base.host}${href}`;
    return baseUrl;
  } catch { return baseUrl; }
}

function extractJobs($, baseUrl) {
  const jobs = [];
  const seen = new Set();

  const selectors = [
    '[class*="job"]','[class*="career"]','[class*="position"]',
    '[class*="opening"]','[class*="vacancy"]','[class*="listing"]','[class*="role"]'
  ];

  let containers = [];
  for (const sel of selectors) {
    const found = $(sel).toArray();
    if (found.length > 0) { containers = found.slice(0, 15); break; }
  }

  if (containers.length > 0) {
    for (const el of containers) {
      const $el = $(el);
      const titleEl = $el.find('h1,h2,h3,h4,h5,a,strong,b').first();
      const title = (titleEl.text() || $el.text()).trim().slice(0, 100);

      if (!title || title.length < 4) continue;
      if (!JOB_KEYWORDS.some(k => title.toLowerCase().includes(k))) continue;
      if (seen.has(title)) continue;
      seen.add(title);

      const linkEl = $el.find('a[href]').first();
      const link = resolveUrl(linkEl.attr('href'), baseUrl);
      const fullText = $el.text().replace(/\s+/g, ' ').trim();
      const description = fullText.slice(title.length).trim().slice(0, 300) || 'Click to view full details.';

      let requirements = '';
      const lower = fullText.toLowerCase();
      for (const kw of ['require','qualification','skill','experience']) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) { requirements = fullText.slice(idx, idx + 200); break; }
      }

      jobs.push({ title, description, requirements, link });
    }
  }

  if (jobs.length === 0) {
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text.length < 5 || text.length > 120) return;
      if (!JOB_KEYWORDS.some(k => text.toLowerCase().includes(k))) return;
      if (seen.has(text)) return;
      seen.add(text);
      jobs.push({ title: text, description: 'Click to view full job details.', requirements: '', link: resolveUrl($el.attr('href'), baseUrl) });
      if (jobs.length >= 10) return false;
    });
  }

  return jobs.slice(0, 10);
}

async function scrapeCompany(company) {
  try {
    const resp = await axios.get(company.url, { headers: HEADERS, timeout: 12000, maxRedirects: 5 });
    const $ = cheerio.load(resp.data);
    $('script,style,nav,footer,header').remove();
    const jobs = extractJobs($, company.url);
    return { ...company, jobs, status: 'success', job_count: jobs.length };
  } catch (err) {
    const status = err.code === 'ECONNABORTED' ? 'timeout' : 'error';
    return { ...company, jobs: [], status, job_count: 0 };
  }
}

async function scrapeAllCompanies() {
  return Promise.all(COMPANIES.map(scrapeCompany));
}

module.exports = { scrapeAllCompanies, scrapeCompany, COMPANIES };
