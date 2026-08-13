const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

// ----------------- ⚙️ কনফিগারেশন শুরু -----------------
const accounts = [
    { email: 'email1@gmail.com' }, // এখানে শুধু ইমেইল দিন, পাসওয়ার্ড লাগবে না
    { email: 'email2@gmail.com' },
    { email: 'email3@gmail.com' },
    { email: 'email4@gmail.com' },
    { email: 'email5@gmail.com' },
];

const recipients = [
    'target1@gmail.com', 
    'target2@gmail.com', 
    'target3@gmail.com', 
    'target4@gmail.com', 
    'target5@gmail.com'
]; 

const subject = "আপনার জন্য বিশেষ উপহার! 🎁";
const message = "হ্যালো, আমাদের অফারটি দেখুন এখানে: https://yourlink.com";

const emailsPerAccount = 5; // প্রতি অ্যাকাউন্ট থেকে কয়টি ইমেইল যাবে
// ----------------- ⚙️ কনফিগারেশন শেষ -----------------

async function startBot() {
    console.log("\n🚀 [SYSTEM] Session-Based Cloud Bot Started!");
    console.log(`👥 Total Accounts: ${accounts.length}`);
    console.log(`🎯 Total Recipients: ${recipients.length}`);
    console.log("-------------------------------------------");

    let recipientIndex = 0;

    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        console.log(`\n🔄 [ACCOUNT ${i+1}] Using session for: ${account.email}`);

        const browser = await puppeteer.launch({
            headless: "new", // ক্লাউডে হেডলেস মোড বাধ্যতামূলক
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                `--user-data-dir=./profiles/profile${i}` // এখানে আপনার আপলোড করা সেশন লোড হবে
            ],
        });

        const page = await browser.newPage();
        
        try {
            // জিমেইল ইনবক্সে যাওয়া
            await page.goto('https://mail.google.com/', { waitUntil: 'networkidle2', timeout: 60000 });

            // চেক করা হচ্ছে সেশন কাজ করছে কি না (যদি লগইন পেজে পাঠিয়ে দেয় তবে সেশন এক্সপায়ার)
            if (page.url().includes('accounts.google.com')) {
                console.log(`❌ [ERROR] Session expired or blocked for ${account.email}. Skipping...`);
                await browser.close();
                continue;
            }

            console.log(`✅ [SUCCESS] Session active for ${account.email}. Starting to send...`);

            let sentFromThisAcc = 0;
            while (sentFromThisAcc < emailsPerAccount && recipientIndex < recipients.length) {
                const currentRecipient = recipients[recipientIndex];
                console.log(`📧 Sending to: ${currentRecipient} (${sentFromThisAcc + 1}/${emailsPerAccount})`);

                try {
                    // Compose বাটনে ক্লিক
                    await page.waitForSelector('[role="button"][gh="cm"]');
                    await page.click('[role="button"][gh="cm"]');
                    await page.waitForTimeout(3000);

                    // প্রাপক ইমেইল টাইপ
                    await page.waitForSelector('input[name="to"]');
                    await page.type('input[name="to"]', currentRecipient);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(2000);

                    // সাবজেক্ট টাইপ
                    await page.waitForSelector('input[name="subjectbox"]');
                    await page.type('input[name="subjectbox"]', subject);
                    await page.waitForTimeout(2000);

                    // মেসেজ বডি টাইপ
                    await page.click('div[aria-label="Message Body"]');
                    await page.type('div[aria-label="Message Body"]', message);
                    await page.waitForTimeout(2000);

                    // সেন্ড (Ctrl + Enter দিয়ে দ্রুত পাঠানো)
                    await page.keyboard.press('Control+Enter');
                    
                    console.log(`🚀 [SENT] Email delivered to ${currentRecipient}`);
                    sentFromThisAcc++;
                    recipientIndex++;

                    // স্প্যাম ফিল্টার এড়াতে বিরতি (১০ সেকেন্ড)
                    await page.waitForTimeout(10000); 

                } catch (sendError) {
                    console.error(`⚠️ [SEND ERROR] Failed to send to ${currentRecipient}: ${sendError.message}`);
                    recipientIndex++; 
                    break; 
                }
            }
        } catch (error) {
            console.error(`❌ [CRITICAL ERROR] ${account.email}: ${error.message}`);
        }

        await browser.close();
        console.log(`🏁 [FINISH] Account ${account.email} completed.`);
    }

    if (recipientIndex >= recipients.length) {
        console.log("\n🎯🎯🎯 ALL EMAILS SENT SUCCESSFULLY! 🎯🎯🎯");
        process.exit(0); 
    } else {
        console.log("\n⚠️ All accounts finished, but some emails are still remaining.");
        process.exit(0);
    }
}

// Railway সার্ভার লাইভ রাখার জন্য এক্সপ্রেস সার্ভার
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('🚀 Gmail Cloud Session Bot is Running! Check Railway Logs to see the magic.');
});

app.listen(PORT, () => {
    console.log(`🌐 Server is live on port ${PORT}`);
    startBot(); // সার্ভার চালু হওয়ার সাথে সাথে বট কাজ শুরু করবে
});
