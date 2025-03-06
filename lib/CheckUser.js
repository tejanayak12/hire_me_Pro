import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
    try {
        const user = await currentUser();
        if (!user) {
            console.warn("CheckUser - No user found");
            return null;
        }

        let loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            }
        });

        if (!loggedInUser) {
            console.log("CheckUser - Creating new user in database...");
            const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

            loggedInUser = await db.user.create({
                data: {
                    clerkUserId: user.id,
                    name: name || "Unknown User",
                    imageUrl: user.imageUrl,
                    email: user.emailAddresses?.[0]?.emailAddress || "",
                }
            });
        }

        // 🚀 Redirect new users to onboarding if industry is not set
        if (!loggedInUser.industry) {
            console.log("CheckUser - User industry not set, redirecting to onboarding...");
            return { redirect: "/onboarding" };
        }

        return loggedInUser;
    } catch (error) {
        console.error("CheckUser - Database error:", error.message);
        return null;
    }
};
