const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding ContentResource for Media Kit...");

    // Find a user ID to attribute creation to (optional, or make up one if no constraints)
    // Actually schema requires valid ID or nullable? createdById is nullable string.
    
    // Clean up existing media kit entries to avoid dupes if re-run? 
    // Maybe better to just add.

    const items = [
        {
            title: "Team1 Logos (Vector/PNG)",
            type: "BRAND_ASSET",
            content: "https://team1.sh/assets/logos.zip",
            status: "published",
            customFields: { description: "Official brand assets including logos and marks.", format: "ZIP" }
        },
        {
            title: "Brand Guidelines 2024",
            type: "FILE", // or BRAND_ASSET
            content: "https://team1.sh/assets/guidelines.pdf",
            status: "published",
            customFields: { description: "Typography, color palette, and usage rules.", format: "PDF" }
        },
        {
            title: "Press Kit & Bios",
            type: "FILE",
            content: "https://team1.sh/assets/press-kit.zip",
            status: "published", // api sets "published"
            customFields: { description: "Founder bios and official photos.", format: "ZIP" }
        },
         {
            title: "Community Highlights Reel",
            type: "BRAND_ASSET", // or just reuse one of the types allowed: BRAND_ASSET, COLOR_PALETTE, BIO, FILE
            content: "https://youtube.com/watch?v=example",
            status: "published",
            customFields: { description: "Video highlights from recent events.", format: "MP4" }
        }
    ];

    for (const item of items) {
        await prisma.contentResource.create({
            data: {
                title: item.title,
                type: item.type,
                content: item.content,
                status: item.status,
                customFields: item.customFields,
                // createdById: ... 
            }
        });
    }
    
    console.log("Seeding ContentResource complete.");
}

main()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
