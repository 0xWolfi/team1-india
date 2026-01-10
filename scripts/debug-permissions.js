
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPermissions(email) {
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
    // Explicitly stringify to see exact JSON structure
    console.log('Permissions (Raw DB):', JSON.stringify(member.permissions, null, 2));
    console.log('Tags:', member.tags);

    const permissions = member.permissions || { default: "READ" };
    const isSuperAdmin = permissions['*'] === 'FULL_ACCESS';
    console.log('Is SuperAdmin?', isSuperAdmin);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debugPermissions('sarnavo@team1.network');
