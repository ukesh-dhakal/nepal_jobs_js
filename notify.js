// notify.js — standalone one-shot script for GitHub Actions
// Usage: node notify.js
// Env:   DISCORD_WEBHOOK_URL (required)

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { scrapeAllCompanies } = require('./scraper');

const SEEN_FILE = path.join(__dirname, 'seen_jobs.json');
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WATCH_KEYWORDS = ['intern', 'internship', 'trainee'];

// ── helpers ──────────────────────────────────────────────

function loadSeen() {
    try {
        return new Set(JSON.parse(fs.readFileSync(SEEN_FILE, 'utf-8')));
    } catch {
        return new Set();
    }
}

function saveSeen(set) {
    fs.writeFileSync(SEEN_FILE, JSON.stringify([...set], null, 2));
}

function makeKey(job) {
    return `${job.company}::${job.title}`.toLowerCase().replace(/\s+/g, '-');
}

function isInternJob(job) {
    const hay = `${job.title} ${job.description}`.toLowerCase();
    return WATCH_KEYWORDS.some(kw => hay.includes(kw));
}

async function sendEmbed(job) {
    const embed = {
        title: `${job.logo || '💼'} ${job.title}`,
        url: job.link,
        color: parseInt((job.color || '#00c896').replace('#', ''), 16),
        author: { name: `🏢 ${job.company}` },
        description: job.description
            ? job.description.slice(0, 300) + (job.description.length > 300 ? '…' : '')
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
            value: job.requirements.slice(0, 200) + (job.requirements.length > 200 ? '…' : ''),
            inline: false,
        });
    }

    embed.fields.push({
        name: '🔗 Apply',
        value: `[View full listing →](${job.link})`,
        inline: false,
    });

    await axios.post(
        WEBHOOK_URL,
        { username: 'Nepal Jobs Scanner', embeds: [embed] },
        { headers: { 'Content-Type': 'application/json' } },
    );

    // Respect Discord rate-limit (5 requests / 2 s per webhook)
    await new Promise(r => setTimeout(r, 500));
}

// ── main ─────────────────────────────────────────────────

(async () => {
    if (!WEBHOOK_URL) {
        console.error('❌  DISCORD_WEBHOOK_URL is not set. Exiting.');
        process.exit(1);
    }

    console.log(`\n[${new Date().toISOString()}] 🔍  Scraping Nepal tech career pages…`);

    const seenKeys = loadSeen();
    const companies = await scrapeAllCompanies();

    const allJobs = [];
    for (const company of companies) {
        console.log(`  ${company.status === 'success' ? '✅' : '❌'}  ${company.name} — ${company.job_count} jobs`);
        for (const job of company.jobs) {
            allJobs.push({ ...job, company: company.name, logo: company.logo, color: company.color });
        }
    }

    const internJobs = allJobs.filter(isInternJob);
    const newJobs = internJobs.filter(j => !seenKeys.has(makeKey(j)));

    console.log(`\n📊  ${internJobs.length} intern job(s) total — ${newJobs.length} new`);

    if (newJobs.length === 0) {
        console.log('   No new intern jobs. Nothing sent to Discord.');
        saveSeen(seenKeys);
        process.exit(0);
    }

    let sent = 0;
    for (const job of newJobs) {
        try {
            await sendEmbed(job);
            seenKeys.add(makeKey(job));
            sent++;
            console.log(`   ✅  Sent: ${job.title} @ ${job.company}`);
        } catch (err) {
            const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            console.error(`   ❌  Failed to send "${job.title}": ${detail}`);
        }
    }

    saveSeen(seenKeys);
    console.log(`\n🎉  Done — ${sent}/${newJobs.length} Discord embed(s) sent. seen_jobs.json updated.\n`);
    process.exit(0);
})();
