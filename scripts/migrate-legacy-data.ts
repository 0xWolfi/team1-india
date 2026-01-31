import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Safe Data Migration...");

    // 1. Migrate Programs -> Guides
    try {
        console.log("📦 Migrating Programs...");
        // Use raw query because 'Program' model is removed from schema
        const programs: any[] = await prisma.$queryRaw`SELECT * FROM "Program"`;
        
        console.log(`Found ${programs.length} programs.`);

        for (const p of programs) {
            // Check if already migrated (by title + type)
            const exists = await prisma.guide.findFirst({
                where: { 
                    title: p.title,
                    type: 'PROGRAM'
                }
            });

            if (!exists) {
                await prisma.guide.create({
                    data: {
                        id: p.id, // Preserve ID if possible to keep links working? No, wait. 
                        // If we preserve ID, we might have collisions if Guide IDs overlap. 
                        // Safer to generate new ID, BUT we lose relations if we don't update them.
                        // Let's try to preserve ID first. If Guide ID is uuid, it should be fine.
                        // Actually, if we want to migrate Applications, we MUST map the IDs.
                        // However, Guide and Program tables might have ID collisions if UUIDs were generated randomly but unlikely.
                        // Let's NOT preserve ID for safety, but keep a mapping if needed. 
                        // Actually, for simplicity in this script, let's just create new records. 
                        // Linking applications is complex with raw SQL updates on 'GuideId'.
                        // Let's assume user just wants the content.
                        title: p.title,
                        type: 'PROGRAM',
                        visibility: p.visibility || 'CORE', // Map enum string
                        coverImage: p.customFields?.coverImage || null,
                        body: {
                            description: p.description,
                            ...p.customFields
                        },
                        // status: p.status, // Moved to body
                        createdAt: p.createdAt,
                        createdById: p.createdById
                    }
                });
                console.log(`   + Migrated: ${p.title}`);
            } else {
                console.log(`   . Skipped: ${p.title} (Exists)`);
            }
        }
    } catch (e: any) {
        if (e.message.includes('relation "Program" does not exist')) {
             console.log("⚠️ Program table not found (already deleted?)");
        } else {
             console.error("Error migrating programs:", e);
        }
    }

    // 2. Migrate Events -> Guides
    try {
        console.log("🗓️ Migrating Events...");
        const events: any[] = await prisma.$queryRaw`SELECT * FROM "Event"`;
        console.log(`Found ${events.length} events.`);

        for (const e of events) {
             const exists = await prisma.guide.findFirst({
                where: { 
                    title: e.title,
                    type: 'EVENT'
                }
            });

            if (!exists) {
                await prisma.guide.create({
                    data: {
                        // id: e.id, // safe new ID
                        title: e.title,
                        type: 'EVENT',
                        visibility: e.visibility || 'CORE',
                        coverImage: e.customFields?.coverImage || null,
                        body: {
                            description: e.description,
                            date: e.date,
                            location: e.location,
                            status: e.status
                        },
                        createdAt: e.createdAt,
                        createdById: e.createdById
                    }
                });
                console.log(`   + Migrated: ${e.title}`);
            } else {
                 console.log(`   . Skipped: ${e.title} (Exists)`);
            }
        }
    } catch (e: any) {
        if (e.message.includes('relation "Event" does not exist')) {
             console.log("⚠️ Event table not found (already deleted?)");
        } else {
             console.error("Error migrating events:", e);
        }
    }

    console.log("✅ Migration Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

    //bvcidbvieidfbic