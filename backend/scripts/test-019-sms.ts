// Standalone test: send a real SMS via 019 to the owner's phone.
// Usage:
//   cd backend && npx ts-node scripts/test-019-sms.ts <phone-e164-without-plus>
// e.g. npx ts-node scripts/test-019-sms.ts 972501234567

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const username = process.env.SMS019_USERNAME || '';
const token = process.env.SMS019_TOKEN || '';
const source = process.env.SMS019_SOURCE || '';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npx ts-node scripts/test-019-sms.ts <phone>');
  process.exit(1);
}

const phone = arg.replace(/^\+/, '').replace(/^0/, '972');
const message = `בדיקה: SMS דרך 019 עובד. הזמן: ${new Date().toLocaleTimeString('he-IL')}`;

const body = {
  sms: {
    user: { username },
    source,
    destinations: { phone },
    message,
  },
};

async function main() {
  if (!username || !token || !source) {
    console.error('Missing SMS019_* env vars');
    process.exit(1);
  }
  console.log(`POST https://019sms.co.il/api  (${phone}, ${message.length} chars)`);
  console.log('Body:', JSON.stringify(body));
  const res = await fetch('https://019sms.co.il/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  console.log('Response:', text);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
