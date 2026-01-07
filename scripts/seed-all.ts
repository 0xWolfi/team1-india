
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAYBOOK_IMAGES = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2932"
];

const EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2940"
];

const CONTENT_IMAGES = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2940",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2940"
];

async function main() {
  console.log('🌱 Starting full seed...');

  // 1. Clear Existing Data
  console.log('🧹 Clearing old data...');
  // Delete in order of dependencies (though cascading might handle it, safer to be explicit)
  await prisma.application.deleteMany();
  await prisma.playbook.deleteMany();
  await prisma.guide.deleteMany(); // Covers Programs and Content
  await prisma.program.deleteMany();
  await prisma.event.deleteMany();
  
  // Get a user for attribution (first member found or create one if needed, assuming user usually exists)
  // If no user, we might fail constraint. Let's find first member.
  const member = await prisma.member.findFirst();
  const memberId = member?.id;

  if (!memberId) {
    console.warn("⚠️ No member found in DB. Data will be created without author or you should run this after Auth setup.");
  }

  // 2. Seed Playbooks
  console.log('📚 Seeding Playbooks...');
  const playbooks = [];
  for (let i = 0; i < 10; i++) {
    playbooks.push({
      title: `Playbook ${i + 1}: ${['Growth Strategy', 'Community Building', 'Tokenomics', 'Governance', 'Marketing'][i % 5]}`,
      description: "A comprehensive guide to mastering this domain. Includes step-by-step instructions and best practices.",
      coverImage: PLAYBOOK_IMAGES[i % PLAYBOOK_IMAGES.length],
      // @ts-ignore
      visibility: i < 7 ? 'PUBLIC' : i < 9 ? 'MEMBER' : 'CORE', // 7 Public, 2 Member, 1 Core
      createdById: memberId,
      body: JSON.stringify({ content: "Sample content..." })
    });
  }
  for (const p of playbooks) {
    // @ts-ignore
    await prisma.playbook.create({ data: p });
  }

  // 3. Seed Programs (using Program model)
  console.log('🚀 Seeding Programs...');
  const programs = [];
  for (let i = 0; i < 10; i++) {
    const kpis = [{ label: "Startups", value: "10+" }, { label: "Funding", value: "$50K" }];
    const timeline = [{ step: "Applications Open", duration: "1 Week" }, { step: "Demo Day", duration: "3 Months" }];
    
    programs.push({
      title: `Program ${i + 1}: ${['Accelerator', 'Mentorship', 'Grant', 'Fellowship', 'Residency'][i % 5]}`,
      // @ts-ignore
      visibility: i < 7 ? 'PUBLIC' : i < 9 ? 'MEMBER' : 'CORE',
      createdById: memberId,
      description: "Join this high-impact program to accelerate your project.",
      customFields: {
          coverImage: PLAYBOOK_IMAGES[i % PLAYBOOK_IMAGES.length],
          kpis,
          timeline
      }
    });
  }
  for (const p of programs) {
    // @ts-ignore
    await prisma.program.create({ data: p });
  }

  // 4. Seed Content (Guides)
  console.log('📝 Seeding Content...');
  const contents = [];
  for (let i = 0; i < 10; i++) {
    contents.push({
      title: `Guide ${i + 1}: ${['How to DAO', 'Smart Contract Security', 'Treasury Management', 'Voter Participation', 'Discord Setup'][i % 5]}`,
      type: "CONTENT",
      // @ts-ignore
      visibility: i < 7 ? 'PUBLIC' : i < 9 ? 'MEMBER' : 'CORE',
      coverImage: CONTENT_IMAGES[i % CONTENT_IMAGES.length],
      createdById: memberId,
      body: {
        description: "Learn the fundamentals and advanced techniques in this guide.",
        rules: ["Rule 1: Be kind", "Rule 2: Contribute"]
      }
    });
  }
  for (const c of contents) {
    // @ts-ignore
    await prisma.guide.create({ data: c });
  }

  // 5. Seed Events
  console.log('📅 Seeding Events...');
  const events = [];
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const eventDate = new Date(now);
    eventDate.setDate(now.getDate() + (i * 7)); // Weekly events
    
    events.push({
      title: `Event ${i + 1}: ${['Web3 Summit', 'Builder Meetup', 'Hackathon', 'Workshop', 'Panel Discussion'][i % 5]}`,
      // @ts-ignore
      visibility: i < 7 ? 'PUBLIC' : i < 9 ? 'MEMBER' : 'CORE',
      date: eventDate,
      location: ['Bangalore', 'Delhi', 'Mumbai', 'Remote/Discord', 'Hyderabad'][i % 5],
      description: "Join us for an amazing event with industry leaders and builders.",
      customFields: {
          coverImage: EVENT_IMAGES[i % EVENT_IMAGES.length]
      },
      createdById: memberId
    });
  }
  for (const e of events) {
    // @ts-ignore
    await prisma.event.create({ data: e });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
