import { industries } from '@/data/industries'
import React from 'react'
import OnboardingForm from './_components/onboarding-form'
import { getUserOnboardingStatus } from '@/actions/user'
import { redirect } from 'next/navigation'

const onboardingpage = async () => {

    // check if user is already onboarded.

    const { isOnboarded } = await getUserOnboardingStatus();

    if (isOnboarded) {
        redirect("/dashboard");
    }

    return (
        <main>
            <OnboardingForm industries={industries} />
        </main>
    )
}

export default onboardingpage