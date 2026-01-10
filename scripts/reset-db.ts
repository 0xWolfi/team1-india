
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database reset...');

  // 1. Delete dependent relations first
  console.log('Deleting Applications...');
  await prisma.application.deleteMany({});
  
  console.log('Deleting Media Posts, Comments, Logs...');
  await prisma.mediaPost.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.experimentComment.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.log.deleteMany({});

  // 2. Delete main entities
  console.log('Deleting Experiments, Operations, MediaItems...');
  await prisma.experiment.deleteMany({});
  await prisma.operation.deleteMany({});
  await prisma.mediaItem.deleteMany({});
  
  console.log('Deleting Partners, Projects, Content, Announcements...');
  await prisma.partner.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.contentResource.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.meetingNote.deleteMany({});
  await prisma.actionItem.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  
  console.log('Deleting Guides...');
  // Guides have self-relations or circular deps sometimes, but mainly just createdBy
  await prisma.guide.deleteMany({});

  console.log('Deleting Playbooks...');
  await prisma.playbook.deleteMany({});

  // 3. Delete Members except Superadmin
  console.log('Deleting Community Members...');
  await prisma.communityMember.deleteMany({});

  console.log('Deleting Members (ALL)...');
  await prisma.member.deleteMany({}); // Delete everyone
  
  console.log('Creating fresh superadmin...');
  await prisma.member.create({
      data: {
          email: 'sarnavo@team1.network',
          name: 'Sarnavo',
          status: 'active',
          permissions: { 
              '*': "FULL_ACCESS"
           },
           tags: ['Superadmin', 'Founder']
      }
  });

  console.log('Database reset complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
