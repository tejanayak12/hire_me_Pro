"use server"
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

const getFallbackInsights = (industry) => {
    // Default fallback data based on common industries
    const fallbacks = {
        "Financial Services": {
            salaryRanges: [
                { role: "Financial Analyst", min: 65000, max: 120000, median: 85000, location: "Remote/Global" },
                { role: "Investment Banker", min: 100000, max: 250000, median: 150000, location: "Remote/Global" },
                { role: "Risk Manager", min: 90000, max: 180000, median: 125000, location: "Remote/Global" },
                { role: "Portfolio Manager", min: 120000, max: 300000, median: 180000, location: "Remote/Global" },
                { role: "Compliance Officer", min: 70000, max: 140000, median: 100000, location: "Remote/Global" },
            ],
            growthRate: 4.5,
            demandLevel: "HIGH",
            topSkills: ["Financial Analysis", "Risk Assessment", "RegTech", "Market Analysis", "Data Visualization"],
            marketOutlook: "POSITIVE",
            keyTrends: ["Digital Transformation", "ESG Investing", "AI in Trading", "Increased Regulatory Scrutiny", "Remote Banking"],
            recommendedSkills: ["Python for Finance", "Blockchain basics", "Financial Modeling", "Soft Skills"],
        },
        "Technology": {
            salaryRanges: [
                { role: "Software Engineer", min: 80000, max: 180000, median: 120000 },
                { role: "Data Scientist", min: 90000, max: 190000, median: 135000 },
                { role: "DevOps Engineer", min: 85000, max: 170000, median: 115000 },
                { role: "Product Manager", min: 95000, max: 200000, median: 140000 },
                { role: "UI/UX Designer", min: 70000, max: 150000, median: 110000 },
            ],
            growthRate: 8.2,
            demandLevel: "HIGH",
            topSkills: ["React/Next.js", "Python", "Cloud Computing", "AI/ML", "Cybersecurity"],
            marketOutlook: "POSITIVE",
            keyTrends: ["AI Integration", "Edge Computing", "Web3 Development", "Remote-First Culture", "Green Tech"],
            recommendedSkills: ["Generative AI", "Rust Engineering", "Distributed Systems", "API Design"],
        }
    };

    return fallbacks[industry] || {
        salaryRanges: [
            { role: "Senior Level", min: 90000, max: 180000, median: 130000 },
            { role: "Mid Level", min: 60000, max: 110000, median: 85000 },
            { role: "Entry Level", min: 40000, max: 70000, median: 55000 },
        ],
        growthRate: 3.0,
        demandLevel: "MEDIUM",
        topSkills: ["Problem Solving", "Communication", "Technical Proficiency"],
        marketOutlook: "NEUTRAL",
        keyTrends: ["Industry Growth", "Skill Diversification"],
        recommendedSkills: ["Continuous Learning", "Adaptability"],
    };
};

export const generateAIInsights = async (industry) => {
    try {
        const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const cleanedtext = text.replace(/```(?:json)?\n?/g, "").trim();
        return JSON.parse(cleanedtext);
    } catch (error) {
        console.warn(`AI Generation failed for ${industry}, using fallback:`, error.message);
        return getFallbackInsights(industry);
    }
}

export async function getIndustryInsights() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
        include: {
            industryInsight: true
        }
    });

    if (!user) throw new Error("User Not Found");

    if (!user.industry) {
        console.warn("User industry is not set. Skipping insights generation.");
        return null; // ⚡ Return null instead of throwing an error
    }

    if (!user.industryInsight || user.industryInsight.salaryRanges.length === 0) {
        try {
            const insights = await generateAIInsights(user.industry);

            if (user.industryInsight) {
                // Update existing placeholder
                return await db.industryInsight.update({
                    where: { id: user.industryInsight.id },
                    data: {
                        ...insights,
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            } else {
                // Create new insight
                return await db.industryInsight.create({
                    data: {
                        industry: user.industry,
                        ...insights,
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        } catch (error) {
            console.warn("AI insights quota reached, showing placeholder UI:", error.message);
            return user.industryInsight;
        }
    }

    return user.industryInsight;
}
