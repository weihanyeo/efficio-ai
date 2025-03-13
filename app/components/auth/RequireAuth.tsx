'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext"; 

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { 
      router.push("/login");
    }
  }, [user, loading, router]); 

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : null; 
}