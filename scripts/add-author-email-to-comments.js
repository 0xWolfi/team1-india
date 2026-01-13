const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding authorEmail column to ExperimentComment table...');
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ExperimentComment" ADD COLUMN IF NOT EXISTS "authorEmail" TEXT;
    `);
    
    console.log('✓ Column added successfully');
    
    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ExperimentComment_authorEmail_idx" ON "ExperimentComment"("authorEmail");
    `);
    
    console.log('✓ Index created successfully');
    console.log('\n✅ Migration completed! Comment authors will now be tracked properly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
