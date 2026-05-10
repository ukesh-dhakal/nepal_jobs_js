// notifier.js — Daily intern job alert via Discord Webhook
const axios = require('axios');
const cron = require('node-cron');

// ─── CONFIG ──────────────────────────────────────────────
const CONFIG = {
  // Paste your Discord webhook URL here
  // Create one: Discord Server → Channel Settings → Integrations → Webhooks
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/1503045870172639495/7nZXV-UpO4LKYt84qoeYs0rIs4UtXACXguc8mxOackR0eDa08AXsmsub13XQxOsiFG0W',

  // Where to send the alert
  NOTIFY_EMAIL: 'dhakalukesh890@gmail.com', // kept for reference, not used

  // Run daily at 9:00 AM Nepal time (UTC+5:45 → 03:15 UTC)
  CRON_SCHEDULE: '15 3 * * *',

  // Keywords to watch for (case-insensitive)
  WATCH_KEYWORDS: ['intern', 'internship', 'trainee'],
};
// ─────────────────────────────────────────────────────────

const { scrapeAllCompanies } = require('./scraper');

// Track jobs already seen so we only alert on NEW ones
let seenJobKeys = new Set();

function makeJobKey(job) {
  return `${job.company}::${job.title}`.toLowerCase().replace(/\s+/g, '-');
}

function isInternJob(job) {
  const hay = (job.title + ' ' + job.description).toLowerCase();
  return CONFIG.WATCH_KEYWORDS.some(kw => hay.includes(kw));
}

async function sendDiscord(jobs) {
  if (!CONFIG.DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks/')) {
    console.warn('   ⚠️  Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL in CONFIG.');
    return;
  }

  for (const job of jobs) {
    // Build a rich Discord embed per job
    const embed = {
      title: `${job.logo || '💼'} ${job.title}`,
      url: job.link,
      color: parseInt((job.color || '#00c875').replace('#', ''), 16),
      author: {
        name: `🏢 ${job.company}`,
      },
      description: job.description
        ? job.description.slice(0, 300) + (job.description.length > 300 ? '...' : '')
        : 'Click the link to view full job details.',
      fields: [],
      footer: {
        text: `Nepal Tech Job Scanner • ${new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}`,
      },
      timestamp: new Date().toISOString(),
    };

    if (job.requirements) {
      embed.fields.push({
        name: '📋 Requirements',
        value: job.requirements.slice(0, 200) + (job.requirements.length > 200 ? '...' : ''),
        inline: false,
      });
    }

    embed.fields.push({
      name: '🔗 Apply',
      value: `[View full listing →](${job.link})`,
      inline: false,
    });

    const payload = {
      username: 'Nepal Jobs Scanner',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      embeds: [embed],
    };

    try {
      await axios.post(CONFIG.DISCORD_WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`   ✅ Discord embed sent: ${job.title} @ ${job.company}`);

      // Discord rate-limit: wait 500ms between messages
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error(`   ❌ Discord send failed (${status}): ${msg}`);
    }
  }
}

async function checkAndNotify() {
  console.log(`[${new Date().toLocaleString()}] 🔍 Checking for intern jobs...`);

  try {
    const companies = await scrapeAllCompanies();
    const allJobs = [];

    for (const company of companies) {
      for (const job of company.jobs) {
        allJobs.push({ ...job, company: company.name, logo: company.logo, color: company.color });
      }
    }

    const internJobs = allJobs.filter(isInternJob);
    const newJobs = internJobs.filter(j => !seenJobKeys.has(makeJobKey(j)));

    console.log(`   Found ${internJobs.length} intern jobs total, ${newJobs.length} new.`);

    if (newJobs.length > 0) {
      await sendDiscord(newJobs);
      // Mark them as seen
      newJobs.forEach(j => seenJobKeys.add(makeJobKey(j)));
    } else {
      console.log('   No new intern jobs — no Discord message sent.');
    }

  } catch (err) {
    console.error('   Error during check:', err.message);
  }
}

function startNotifier() {
  console.log(`📬 Discord notifier started — checking daily at 9:00 AM NPT`);
  console.log(`   Watching for: ${CONFIG.WATCH_KEYWORDS.join(', ')}`);
  console.log(`   Webhook configured: ${CONFIG.DISCORD_WEBHOOK_URL.includes('discord.com') ? '✅' : '❌ (not set yet)'}\n`);

  // Schedule daily check
  cron.schedule(CONFIG.CRON_SCHEDULE, checkAndNotify, {
    timezone: 'Asia/Kathmandu',
  });

  // Also run once immediately on startup
  console.log('   Running initial check now...');
  checkAndNotify();
}

module.exports = { startNotifier, checkAndNotify };
