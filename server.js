const express = require('express');
const cors = require('cors');
// এখানে মনোযোগ দিন: { Browserbase } ব্র্যাকেটসহ লিখতে হবে
const { Browserbase } = require('@browserbasehq/sdk');
const { chromium } = require('playwright-core');

const app = express();
app.use(cors());
app.use(express.json());

// API Key এবং Project ID ভ্যারিয়েবল থেকে নিচ্ছে
const bb = new Browserbase({ 
    apiKey: process.env.BROWSERBASE_API_KEY 
});

app.post('/run-bot', async (req, res) => {
    const { email } = req.body;
    console.log(`Cloud bot triggered for: ${email}`);

    try {
        // ক্লাউড সেশন তৈরি
        const session = await bb.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID,
            browserSettings: { contextKey: email }
        });

        // অটোমেশন লজিক (পিসি অফ থাকলেও চলবে)
        (async () => {
            try {
                const browser = await chromium.connectOverCDP(
                    `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${session.id}`
                );
                const page = await browser.contexts()[0].newPage();
                await page.goto('https://mail.google.com');
                console.log(`Success: Bot active in cloud for ${email}`);
            } catch (automationError) {
                console.error("Automation error:", automationError.message);
            }
        })();

        res.json({ success: true, sessionId: session.id, status: "Active in Cloud" });

    } catch (error) {
        console.error("Session Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Railway এর জন্য পোর্ট সেটআপ
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Server is running on port ${PORT}`);
});
