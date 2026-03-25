import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const defaultSchedule = {
  '0': { isOpen: false, ranges: [] },
  '1': { isOpen: false, ranges: [] },
  '2': { isOpen: false, ranges: [] },
  '3': { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  '4': { isOpen: false, ranges: [] },
  '5': { isOpen: false, ranges: [] },
  '6': { isOpen: false, ranges: [] },
};

async function main() {
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: { schedule: defaultSchedule, advanceBookingDays: 14 },
    create: {
      id: 'default',
      schedule: defaultSchedule,
      advanceBookingDays: 14,
      blockedDates: [],
    },
  });
  console.log('✅ הגדרות ברירת מחדל נוצרו');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
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
