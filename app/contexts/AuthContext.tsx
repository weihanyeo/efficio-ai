'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { acceptInvite } from '../utils/inviteUtils';

interface UserProfile {
  full_name: string;
  email: string;
  bio: string;
}

interface AuthContextType {
  user: User | null;
  onboardingCompleted: boolean;
  loading: boolean;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (full_name: string, email: string, bio: string) => Promise<void>;
  updatePassword: (old_password: string, new_password: string, confirm_password: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  deleteAccount: (usernameConfirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      setOnboardingCompleted(data?.onboarding_completed === true);
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthProvider state:', { user, loading, onboardingCompleted });

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
  
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
  
        setProfile(data);
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      }
    };

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth session:', session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkOnboardingStatus(session.user.id);
        fetchProfile(session.user.id)
        handlePendingInvites();
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          checkOnboardingStatus(session.user.id);
          fetchProfile(session.user.id)
          handlePendingInvites();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle any pending invites after login
  const handlePendingInvites = async () => {
    try {
      // Check if there's a pending invite in localStorage
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (!pendingInvite) return;
      
      console.log('Found pending invite:', pendingInvite);
      
      // Accept the invite using the token
      const result = await acceptInvite(pendingInvite);
      
      if (result.success) {
        console.log('Successfully accepted pending invite');
        // Clear the pending invite
        localStorage.removeItem('pendingInvite');
        
        // Redirect to the workspace if available
        if (result.workspace_id) {
          window.location.href = `/workspace/${result.workspace_id}`;
        }
      } else {
        console.error('Failed to accept pending invite:', result.error);
      }
    } catch (error) {
      console.error('Error handling pending invite:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;
      setOnboardingCompleted(true);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      throw err;
    }
  };


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: name,
          onboarding_completed: false
        });

      if (profileError) throw profileError;
    } catch (err) {
      console.error('Failed to sign up:', err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;


    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (full_name: string, email: string, bio: string) => {
    if (!user) return;
  
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, email, bio }) 
      .eq("id", user.id);
  
    if (error) throw error;
  
    setProfile((prev: UserProfile | null) => {
      if (prev) {
        return {
          ...prev,
          full_name,
          email,
          bio,
        };
      } else {
        return { full_name, email, bio };
      }
    });
  };

  const updatePassword =  async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    if (!user) throw new Error("User is not authenticated");
  
    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: oldPassword,
    });
  
    if (signInError) {
      throw new Error("Old password is incorrect");
    }
  
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
  
    if (updateError) {
      throw updateError;
    }
  }

  // https://tgqfyrgftbobrtuhvgzq.supabase.co/functions/v1/delete-account
  const deleteAccount = async () => {
    const { data, error } = await supabase.auth.getSession();
  
    if (error || !data.session) {
      alert("Error retrieving session. Please log in again.");
      return;
    }
  
    const response = await fetch("https://yinczthpiafqttfqilbn.supabase.co/functions/v1/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`, 
      },
      body: JSON.stringify({ email: data.session.user.email }),
    });
  
    const responseData = await response.json();
    console.log("Response data:", responseData);
  
    if (response.ok) {
      alert("Account deleted successfully!");
      signOut(); // Log the user out
    } else {
      alert(`Error: ${responseData.error}`);
    }
  };
  
  
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      loading, 
      onboardingCompleted,
      signIn, 
      signUp, 
      signOut,
      updateProfile,
      completeOnboarding,
      updatePassword,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};