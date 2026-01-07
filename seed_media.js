const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Media Items...");

    const items = [
        {
            title: "Team1 Logos (Vector/PNG)",
            links: ["https://team1.sh/assets/logos.zip"],
            description: "Official brand assets including logos and marks.",
            status: "approved",
            platform: ["WEB"]
        },
        {
            title: "Brand Guidelines 2024",
            links: ["https://team1.sh/assets/guidelines.pdf"],
            description: "Typography, color palette, and usage rules.",
            status: "approved",
            platform: ["WEB"]
        },
        {
            title: "Press Kit & Bios",
            links: ["https://team1.sh/assets/press-kit.zip"],
            description: "Founder bios and official photos.",
            status: "approved",
            platform: ["WEB"]
        },
         {
            title: "Community Highlights Reel",
            links: ["https://youtube.com/watch?v=example"],
            description: "Video highlights from recent events.",
            status: "approved",
            platform: ["YOUTUBE"]
        }
    ];

    for (const item of items) {
        await prisma.mediaItem.create({
            data: item
        });
    }
    
    console.log("Seeding complete.");
}

main()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
