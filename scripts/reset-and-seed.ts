const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. Clean Database
  console.log('🧹 Cleaning database...');
  // Delete in order of dependency (child first)
  try {
      await prisma.auditLog.deleteMany({});
      await prisma.experimentComment.deleteMany({});
      await prisma.experiment.deleteMany({});
      await prisma.contentResource.deleteMany({});
      await prisma.mediaPost.deleteMany({});
      await prisma.comment.deleteMany({});
      await prisma.mediaItem.deleteMany({});
      await prisma.application.deleteMany({});
      await prisma.guide.deleteMany({});
      await prisma.event.deleteMany({});
      await prisma.program.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.partner.deleteMany({});
      await prisma.operation.deleteMany({});
      await prisma.playbook.deleteMany({});
      await prisma.communityMember.deleteMany({});
      await prisma.member.deleteMany({});
  } catch (e: any) {
      console.warn("Cleanup warning (tables might not exist yet):", e.message);
  }
  
  console.log('✅ Database cleaned');

  // 2. Create Superadmin
  console.log('👤 Creating Superadmin...');
  const superadminEmail = 'sarnavo@team1.network';
  
  await prisma.member.upsert({
    where: { email: superadminEmail },
    update: {
      name: 'Sarnavo Superadmin',
      permissions: { '*': 'FULL_ACCESS' },
      tags: ['Founder', 'Admin'],
      status: 'active'
    },
    create: {
      email: superadminEmail,
      name: 'Sarnavo Superadmin',
      image: '',
      permissions: { '*': 'FULL_ACCESS' },
      tags: ['Founder', 'Admin'],
      status: 'active'
    }
  });

  console.log(`✅ Superadmin created: ${superadminEmail}`);
  console.log('🌱 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
