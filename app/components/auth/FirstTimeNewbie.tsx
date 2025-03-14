'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext"; 

export function FirstTimeNewbie({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    // If user has already completed onboarding, redirect to dashboard
    if (!loading && user && onboardingCompleted) { 
      router.push("/dashboard");
    }
  }, [user, loading, router, onboardingCompleted]); 

  // Only show onboarding to users who haven't completed it
  return (!loading && user && !onboardingCompleted) ? <>{children}</> : null; 
}