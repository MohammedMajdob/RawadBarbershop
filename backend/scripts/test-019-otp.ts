// Sends a real OTP-format SMS via 019 — same shape as production SmsService.
// Usage: npx ts-node scripts/test-019-otp.ts <phone>

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const username = process.env.SMS019_USERNAME || '';
const token = process.env.SMS019_TOKEN || '';
const source = process.env.SMS019_SOURCE || '';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npx ts-node scripts/test-019-otp.ts <phone>');
  process.exit(1);
}

const phone = arg.replace(/^\+/, '').replace(/^0/, '972');
const code = Math.floor(100000 + Math.random() * 900000).toString();
const message = `קוד האימות שלך: ${code}`;

async function main() {
  console.log(`OTP ${code} → ${phone} (${message.length} chars)`);
  const res = await fetch('https://019sms.co.il/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sms: {
        user: { username },
        source,
        destinations: { phone },
        message,
      },
    }),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status} ${text}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
