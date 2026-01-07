const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- MediaItem ---");
    const media = await prisma.mediaItem.findMany({ take: 5 });
    console.log(JSON.stringify(media, null, 2));

    console.log("--- ContentResource ---");
    const content = await prisma.contentResource.findMany({ take: 5 });
    console.log(JSON.stringify(content, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
