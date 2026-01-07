
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const types = ['EVENT', 'PROGRAM', 'CONTENT'];

async function main() {
    console.log("Seeding Public Guides...");

    // Get a valid member to assign authorship
    const member = await prisma.member.findFirst();
    if (!member) {
        console.error("No member found. Create a member first.");
        return;
    }

    const coverImages = [
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        "https://images.unsplash.com/photo-1551818255-e6e10975bc17",
        "https://images.unsplash.com/photo-1596524430615-b46476ddc820",
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94"
    ];

    for (const type of types) {
        console.log(`Creating 5 ${type} guides...`);
        for (let i = 1; i <= 5; i++) {
            await prisma.guide.create({
                data: {
                    type,
                    title: `Public ${type} Guide ${i}`,
                    visibility: 'PUBLIC',
                    coverImage: coverImages[(i - 1) % coverImages.length],
                    body: {
                        description: `This is a sample public guide for ${type}. It contains detailed instructions and best practices.`,
                        kpis: [{ label: "Participants", value: "100+" }],
                        timeline: [{ step: "Planning", duration: "1 week" }],
                        rules: ["Be respectful", "Have fun"]
                    },
                    formSchema: [
                        { id: "q1", key: "name", label: "Full Name", type: "text", required: true },
                        { id: "q2", key: "email", label: "Email Address", type: "email", required: true }
                    ],
                    createdById: member.id
                }
            });
        }
    }
    console.log("Seeding complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
