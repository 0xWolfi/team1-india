const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding createdByEmail column to Experiment table...');
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Experiment" ADD COLUMN IF NOT EXISTS "createdByEmail" TEXT;
    `);
    
    console.log('✓ Column added successfully');
    
    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Experiment_createdByEmail_idx" ON "Experiment"("createdByEmail");
    `);
    
    console.log('✓ Index created successfully');
    console.log('\n✅ Migration completed! Members can now create experiments.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
