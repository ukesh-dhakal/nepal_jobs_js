// test_discord.js — send a demo embed and exit
const axios = require('axios');

const WEBHOOK = 'https://discord.com/api/webhooks/1503045870172639495/7nZXV-UpO4LKYt84qoeYs0rIs4UtXACXguc8mxOackR0eDa08AXsmsub13XQxOsiFG0W';

const payload = {
    username: 'Nepal Jobs Scanner',
    content: '👋 **Demo alert!** Here\'s what a real intern job notification looks like:',
    embeds: [
        {
            title: '🎯 Software Engineering Intern',
            url: 'https://www.lftechnology.com/careers/',
            color: 0x00C896,
            author: { name: '🐸 Leapfrog Technology' },
            description:
                'We are looking for passionate interns to join our team and work on real-world projects alongside experienced engineers.',
            fields: [
                {
                    name: '📋 Requirements',
                    value:
                        'Pursuing BS/MS in CS or related field. Familiar with JS, Python or Go. Strong problem-solving skills.',
                    inline: false,
                },
                {
                    name: '🔗 Apply',
                    value: '[View full listing →](https://www.lftechnology.com/careers/)',
                    inline: false,
                },
            ],
            footer: { text: 'Nepal Tech Job Scanner • Demo Message' },
            timestamp: new Date().toISOString(),
        },
    ],
};

axios
    .post(WEBHOOK, payload, { headers: { 'Content-Type': 'application/json' } })
    .then((r) => {
        console.log('✅ Demo embed sent! HTTP', r.status);
        process.exit(0);
    })
    .catch((e) => {
        console.error('❌ Failed:', e.response?.status, JSON.stringify(e.response?.data));
        process.exit(1);
    });
