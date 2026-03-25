import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Sunday=0 through Saturday=6
const defaultSchedule = {
  '0': { isOpen: true, ranges: [{ start: '09:00', end: '20:00' }] },  // ראשון
  '1': { isOpen: true, ranges: [{ start: '09:00', end: '20:00' }] },  // שני
  '2': { isOpen: true, ranges: [{ start: '09:00', end: '20:00' }] },  // שלישי
  '3': { isOpen: true, ranges: [{ start: '09:00', end: '20:00' }] },  // רביעי
  '4': { isOpen: true, ranges: [{ start: '09:00', end: '20:00' }] },  // חמישי
  '5': { isOpen: true, ranges: [{ start: '09:00', end: '14:00' }] },  // שישי
  '6': { isOpen: false, ranges: [] },                                   // שבת
};

async function main() {
  // ── Reset: clear all bookings and customers ──
  await prisma.booking.deleteMany({});
  console.log('🗑️  כל התורים נמחקו');

  await prisma.customer.deleteMany({});
  console.log('🗑️  כל הלקוחות נמחקו');

  // ── Settings with working schedule ──
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: { schedule: defaultSchedule, advanceBookingDays: 14, blockedDates: [] },
    create: {
      id: 'default',
      schedule: defaultSchedule,
      advanceBookingDays: 14,
      blockedDates: [],
    },
  });
  console.log('✅ הגדרות ולוח זמנים נוצרו (ראשון-חמישי 09:00-20:00, שישי 09:00-14:00)');

  // ── Admin user ──
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log('✅ משתמש אדמין נוצר (admin / admin123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
