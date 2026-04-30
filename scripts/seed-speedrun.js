const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const existing = await prisma.speedrunRun.findFirst({ where: { isCurrent: true } });
  if (existing) {
    console.log('Current run already exists:', existing.slug);
    return;
  }
  const run = await prisma.speedrunRun.create({
    data: {
      slug: 'may-2026',
      monthLabel: 'MAY 2026',
      status: 'registration_open',
      isCurrent: true,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-28'),
      registrationDeadline: new Date('2026-05-07'),
    },
  });
  console.log('✓ Seeded current run:', run.slug, run.id);
})().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
