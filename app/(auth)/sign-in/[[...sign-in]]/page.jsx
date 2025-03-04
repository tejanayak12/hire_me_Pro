"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SignInPage = () => {
    const { isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn) {
            console.log("Already signed in, redirecting to dashboard...");
            router.replace("/dashboard");
        }
    }, [isSignedIn, router]);

    if (isSignedIn) return null;

    return (
        <div>
            <h1 className="text-4xl font-bold gradient-title mb-5 text-center">Sign In</h1>
            {/* 🔥 Updated: Replace `redirectUrl` with `forceRedirectUrl` */}
            <SignIn forceRedirectUrl="/dashboard" />
        </div>
    );
};

export default SignInPage;
