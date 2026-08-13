const express = require('express');
const cors = require('cors');
const Browserbase = require('@browserbasehq/sdk');
const { chromium } = require('playwright-core');

const app = express();
app.use(cors());
app.use(express.json());

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

app.post('/run-bot', async (req, res) => {
    const { email } = req.body;
    console.log(`Cloud request received for: ${email}`);
    try {
        const session = await bb.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID,
            browserSettings: { contextKey: email }
        });

        (async () => {
            try {
                const browser = await chromium.connectOverCDP(
                    `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${session.id}`
                );
                const page = await browser.contexts()[0].newPage();
                await page.goto('https://mail.google.com'); 
                console.log(`Bot started in cloud for ${email}`);
            } catch (e) {
                console.error("Automation error:", e.message);
            }
        })();

        res.json({ success: true, sessionId: session.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server live on port ${PORT}`);
});
