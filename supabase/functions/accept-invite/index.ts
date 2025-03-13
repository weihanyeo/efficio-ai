// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== ACCEPT INVITE PROCESS STARTED ===");
    
    // Log headers for debugging (excluding Authorization for security)
    const headers = Object.fromEntries(
      [...req.headers.entries()].filter(([key]) =>
        key.toLowerCase() !== "authorization"
      ),
    );
    console.log("Request headers:", headers);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("ERROR: Missing Authorization header");
      return new Response(
        JSON.stringify({
          error: "Missing Authorization header",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }
    console.log("Authorization header present");

    // Create Supabase clients with the user's JWT token
    console.log("Creating Supabase clients");
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    // Create a Supabase client with the service role key for admin operations
    const supabaseServer = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        },
      },
    );
    console.log("Supabase clients created");

    // Get the current user
    console.log("Getting current user");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("ERROR: Failed to get user", userError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: userError?.message || "No authenticated user",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }
    console.log("Got user:", { id: user.id, email: user.email });

    // Parse the request body
    console.log("Parsing request body");
    const { token } = await req.json();
    if (!token) {
      console.log("ERROR: Missing token in request body");
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Token is required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }
    console.log("Got token:", token);

    // Validate the invite token
    console.log("Validating invite token");
    const { data: invite, error: inviteError } = await supabaseServer
      .from("workspace_invites")
      .select("*, workspace:workspaces(*)")
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.log("ERROR: Invalid or expired invite", inviteError);
      return new Response(
        JSON.stringify({
          error: "Invalid or expired invite",
          details: inviteError?.message || "Invite not found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }
    console.log("Invite valid:", { 
      id: invite.id, 
      workspace_id: invite.workspace_id, 
      email: invite.email,
      role: invite.role
    });

    // Check if user has a profile
    console.log("Checking if user has a profile");
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
      
    if (profileError) {
      console.log("ERROR: Failed to check profile", profileError);
      return new Response(
        JSON.stringify({
          error: "Error checking profile",
          details: profileError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    
    let userProfile = profile;
    if (!profile) {
      console.log("No profile found, creating new profile for user:", user.id);
      
      // Get user metadata and email for better profile information
      const userEmail = user.email || '';
      const userFullName = user.user_metadata?.full_name || '';
      const userName = userEmail.split('@')[0] || '';
      console.log("User info for profile:", { userEmail, userFullName, userName, metadata: user.user_metadata });
      
      // Prepare profile data with more complete information
      const profileData = {
        id: user.id,
        email: userEmail,
        full_name: userFullName || userName || "New User",
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Creating profile with data:", profileData);
      
      const { error: createProfileError } = await supabaseServer
        .from("profiles")
        .insert(profileData);
        
      if (createProfileError) {
        console.log("ERROR: Failed to create profile", createProfileError);
        return new Response(
          JSON.stringify({
            error: "Error creating profile",
            details: createProfileError.message,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        );
      }
      console.log("Profile created successfully");
      
      // Fetch the newly created profile to ensure it exists
      console.log("Fetching newly created profile");
      const { data: newProfile, error: newProfileError } = await supabaseServer
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (newProfileError || !newProfile) {
        console.log("ERROR: Failed to fetch newly created profile", newProfileError);
        return new Response(
          JSON.stringify({
            error: "Error fetching newly created profile",
            details: newProfileError?.message || "Profile not found after creation",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        );
      }
      
      userProfile = newProfile;
      console.log("Created new profile:", userProfile);
    } else {
      console.log("Existing profile found:", { 
        id: profile.id, 
        email: profile.email, 
        full_name: profile.full_name 
      });
    }
    
    // Check if user is already a member of the workspace
    console.log("Checking if user is already a member of workspace:", invite.workspace_id);
    const { data: existingMember, error: memberCheckError } = await supabaseServer
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", invite.workspace_id)
      .eq("member_id", user.id)
      .maybeSingle();
    
    if (memberCheckError) {
      console.log("ERROR: Failed to check workspace membership", memberCheckError);
      return new Response(
        JSON.stringify({
          error: "Error checking workspace membership",
          details: memberCheckError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    
    if (existingMember) {
      console.log("User is already a member of workspace:", existingMember);
      // User is already a member, just update the invite status
      console.log("Updating invite status to accepted");
      const { error: inviteUpdateError } = await supabaseServer
        .from("workspace_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);
      
      if (inviteUpdateError) {
        console.log("ERROR: Failed to update invite status", inviteUpdateError);
        return new Response(
          JSON.stringify({
            error: "Error updating invite status",
            details: inviteUpdateError.message,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        );
      }
      console.log("Invite status updated successfully");
      
      // Update onboarding status for existing profile
      const { error: profileUpdateError } = await supabaseServer
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.log("ERROR: Failed to update profile onboarding status", profileUpdateError);
        // Don't return error - this is not critical
      } else {
        console.log("Profile onboarding status updated successfully");
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "You are already a member of this workspace",
          workspace_id: invite.workspace_id,
          workspace: invite.workspace,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
    
    // Add user to workspace members
    console.log("Adding user to workspace members");
    const memberData = {
      workspace_id: invite.workspace_id,
      member_id: user.id,
      role: invite.role,
      created_at: new Date().toISOString()
    };
    console.log("Member data:", memberData);
    
    const { error: memberError } = await supabaseServer
      .from("workspace_members")
      .insert(memberData);
    
    if (memberError) {
      console.log("ERROR: Failed to add member", memberError);
      return new Response(
        JSON.stringify({
          error: "Error adding member",
          details: memberError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Update onboarding status for the user's profile
    const { error: profileUpdateError } = await supabaseServer
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.log("ERROR: Failed to update profile onboarding status", profileUpdateError);
      // Don't return error - this is not critical
    } else {
      console.log("Profile onboarding status updated successfully");
    }
    
    // Verify the member was added successfully
    console.log("Verifying workspace member was created");
    const { data: verifyMember, error: verifyError } = await supabaseServer
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", invite.workspace_id)
      .eq("member_id", user.id)
      .single();
      
    if (verifyError || !verifyMember) {
      console.error("ERROR: Failed to verify workspace member was created:", verifyError);
      return new Response(
        JSON.stringify({
          error: "Failed to verify workspace membership",
          details: verifyError?.message || "Member not found after creation",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    
    console.log("Successfully added user to workspace:", verifyMember);
    
    // Update invite status
    console.log("Updating invite status to accepted");
    const { error: inviteUpdateError } = await supabaseServer
      .from("workspace_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);
    
    if (inviteUpdateError) {
      console.log("ERROR: Failed to update invite status", inviteUpdateError);
      return new Response(
        JSON.stringify({
          error: "Error updating invite status",
          details: inviteUpdateError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    console.log("Invite status updated successfully");
    
    console.log("=== ACCEPT INVITE PROCESS COMPLETED SUCCESSFULLY ===");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully joined workspace",
        workspace_id: invite.workspace_id,
        workspace: invite.workspace,
        profile: userProfile
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("=== ACCEPT INVITE PROCESS FAILED WITH ERROR ===");
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
