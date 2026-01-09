const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning database...");
    try {
        // Delete in order to avoid foreign key constraints
        await prisma.assessment.deleteMany();
        await prisma.resume.deleteMany();
        await prisma.coverLetter.deleteMany();
        await prisma.user.deleteMany();
        await prisma.industryInsight.deleteMany();

        console.log("Database cleaned successfully!");
    } catch (error) {
        console.error("Error cleaning database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
