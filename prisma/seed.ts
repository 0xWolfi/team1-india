import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = "sarnavoss.dev@gmail.com";
  
  const user = await prisma.member.upsert({
    where: { email },
    update: {
      permissions: { "*": "FULL_ACCESS" },
      status: "active"
    },
    create: {
      email,
      permissions: { "*": "FULL_ACCESS" },
      status: "active"
    }
  });

  console.log({ user });
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
