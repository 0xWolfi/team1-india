
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPermissions(email: string) {
  console.log(`Debug Permissions for: ${email}`);
  
  try {
    const member = await prisma.member.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!member) {
      console.log('Member not found in DB!');
      return;
    }

    console.log('Member Found:', member.email);
    console.log('Permissions (Raw DB):', member.permissions);
    console.log('Tags:', member.tags);

    // Simulate Auth Logic
    const permissions = (member.permissions as any) || { default: "READ" };
    console.log('Permissions Object:', permissions);

    const isSuperAdmin = permissions['*'] === 'FULL_ACCESS';
    console.log('Is SuperAdmin?', isSuperAdmin);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debugPermissions('sarnavo@team1.network');
