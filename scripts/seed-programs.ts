
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const publicPrograms = [
    { title: "AI for Good Fellowship", description: "A 3-month intensive program for developers building AI for social impact. Mentorship from industry leaders." },
    { title: "Web3 Builder Cohort", description: "Join 50 other builders in this 6-week sprint to launch your first dApp. Includes grant opportunities." },
    { title: "Climate Tech Accelerator", description: "For startups focused on carbon removal and renewable energy. Access to funding and pilot partners." },
    { title: "Open Source Maintainers", description: "Learn how to manage and scale open source projects. Stipends available for top contributors." },
    { title: "Design Systems Workshop", description: "Master the art of creating scalable UI kits and design languages. 4 weeks, remote." },
    { title: "Product Management 101", description: "Transition into PM roles with this comprehensive guide and mentorship circle." },
    { title: "Zero to One Founder Series", description: "Weekly talks and workshops with founders who have successfully exited." },
    { title: "DevOps Engineering Bootcamp", description: "Hands-on training in CI/CD, Kubernetes, and Cloud Infrastructure." },
    { title: "Blockchain Security Audit", description: "Learn how to audit smart contracts and secure decentralized protocols." },
    { title: "Community Building Masterclass", description: "Strategies for growing and engaging online communities." }
  ];

  console.log("Seeding Public Programs...");

  for (const p of publicPrograms) {
    // @ts-ignore
    const exists = await prisma.program.findFirst({ where: { title: p.title } });
    if (!exists) {
        // @ts-ignore
        await prisma.program.create({
        data: {
            title: p.title,
            description: p.description,
            status: "active",
            // visibility: "PUBLIC", 
            customFields: {
                coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
            }
        }
        });
        console.log(`Created: ${p.title}`);
    } else {
        console.log(`Skipped: ${p.title} (Exists)`);
    }
  }
  console.log("Seeding Complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
