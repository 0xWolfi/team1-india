import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Starting Experiments Module Test...");

  // 1. Setup: Ensure a test user exists
  const testEmail = "test-admin@team1india.com";
  let user = await prisma.member.findUnique({ where: { email: testEmail } });
  
  if (!user) {
    console.log("Creating test user...");
    user = await prisma.member.create({
      data: {
        email: testEmail,
        name: "Test Admin",
        permissions: { "*": "FULL_ACCESS" }, // Superadmin for testing
        status: "active"
      }
    });
  }
  console.log(`✅ User Ready: ${user.email} (${user.id})`);

  // 2. Create Experiment
  console.log("\nTesting: Create Experiment...");
  const experiment = await prisma.experiment.create({
    data: {
      title: "Test Proposal: Mars Base",
      description: "We should build a base on Mars.",
      stage: "PROPOSED",
      createdById: user.id
    }
  });
  console.log(`✅ Experiment Created: ${experiment.title} (${experiment.id})`);

  // 3. Add Comment
  console.log("\nTesting: Add Comment...");
  const comment = await prisma.experimentComment.create({
    data: {
      experimentId: experiment.id,
      authorId: user.id,
      body: "This seems expensive but critical."
    }
  });
  console.log(`✅ Comment Added: ${comment.body}`);

  // 4. Update Status
  console.log("\nTesting: Update Status to DISCUSSION...");
  const updatedExp = await prisma.experiment.update({
    where: { id: experiment.id },
    data: { stage: "DISCUSSION" }
  });
  console.log(`✅ Status Updated: ${updatedExp.stage}`);

  // 5. Fetch Details
  console.log("\nTesting: Fetch Full Details...");
  const fetched = await prisma.experiment.findUnique({
    where: { id: experiment.id },
    include: {
        comments: { include: { author: true } },
        createdBy: true
    }
  });

  if (fetched && fetched.comments.length > 0 && fetched.createdBy) {
      console.log("✅ Fetch Successful: Matches expected structure.");
  } else {
      console.error("❌ Fetch Failed: Missing relations.");
  }

  // 6. Cleanup (Optional, commented out to inspect DB)
  // await prisma.experiment.delete({ where: { id: experiment.id } });
  
  console.log("\n🎉 Test Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
