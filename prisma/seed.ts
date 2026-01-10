import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLAYBOOK_IMAGES = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2932"
];

const GUIDE_IMAGES = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    "https://images.unsplash.com/photo-1551818255-e6e10975bc17",
    "https://images.unsplash.com/photo-1596524430615-b46476ddc820",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94"
];

async function main() {
  console.log("🌱 Starting Seed...");

  // 1. Ensure Superadmin
  console.log('👤 Ensuring Superadmin...');
  const email = "sarnavo@team1.network"; // Consistent with reset-db.ts
  
  const superadmin = await prisma.member.upsert({
    where: { email },
    update: {
      permissions: { "*": "FULL_ACCESS" },
      status: "active",
      tags: ['Superadmin', 'Founder']
    },
    create: {
      email,
      name: 'Sarnavo',
      permissions: { "*": "FULL_ACCESS" },
      status: "active",
      tags: ['Superadmin', 'Founder']
    }
  });

  // 2. Seed Public Guides (Events, Programs, Content)
  const types = ['EVENT', 'PROGRAM', 'CONTENT'];
  console.log("📚 Seeding Public Guides...");

  for (const type of types) {
      console.log(`   - Creating ${type} guides...`);
      for (let i = 1; i <= 5; i++) {
          await prisma.guide.create({
              data: {
                  type,
                  title: `Public ${type} Guide ${i}`,
                  visibility: 'PUBLIC',
                  coverImage: GUIDE_IMAGES[(i - 1) % GUIDE_IMAGES.length],
                  body: {
                      description: `This is a sample public guide for ${type}. It contains detailed instructions and best practices.`,
                      kpis: [{ label: "Participants", value: "100+" }],
                      timeline: [{ step: "Planning", duration: "1 week" }],
                      rules: ["Be respectful", "Have fun"],
                      date: type === 'EVENT' ? new Date(new Date().setDate(new Date().getDate() + i * 7)) : undefined,
                      location: type === 'EVENT' ? 'Bangalore, India' : undefined
                  },
                  formSchema: [
                      { id: "q1", key: "name", label: "Full Name", type: "text", required: true },
                      { id: "q2", key: "email", label: "Email Address", type: "email", required: true }
                  ],
                  createdById: superadmin.id
              }
          });
      }
  }

  // 3. Seed Playbooks
  console.log("📖 Seeding Playbooks...");
  for (let i = 0; i < 5; i++) {
      await prisma.playbook.create({
          data: {
              title: `Core Playbook ${i + 1}`,
              description: "A comprehensive guide to internal operations.",
              coverImage: PLAYBOOK_IMAGES[i % PLAYBOOK_IMAGES.length],
              visibility: i < 3 ? 'CORE' : 'MEMBER', 
              body: { content: "Sample playbook content..." },
              createdById: superadmin.id,
              status: "published"
          }
      });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
