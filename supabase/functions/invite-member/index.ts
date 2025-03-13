// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://efficio.ai";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Missing Authorization header",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    // Create a Supabase client with the Auth context of the function
    const supabaseServer = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
    );
    // Set the auth token manually
    const { data: { user }, error: authError } = await supabaseClient.auth
      .getUser(token);

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: authError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    if (!user) {
      console.error("No user found in session");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "No user found in session",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const workspace_id = body.workspace_id;
    const email = body.email;
    const role = body.role;
    const teamFunction = body.function;
    const expiry_days = body.expiry_days || 7;

    if (!workspace_id || !role || !teamFunction) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log({workspace_id, user_id: user.id})

    // Now check workspace membership using the profile ID
    const { data: memberData, error: memberError } = await supabaseServer
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("member_id", user.id)
      .single()

    console.log({ memberData, memberError });

    if (memberError) {
      console.error("Member permission check error:", memberError);
      return new Response(
        JSON.stringify({
          error:
            "You do not have permission to invite members to this workspace",
          details: memberError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    if (!memberData) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this workspace" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    if (memberData.role !== "owner" && role === "owner") {
      return new Response(
        JSON.stringify({ error: "Only owners can invite other owners" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    // Generate a random invite code (easier to share verbally)
    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const code = generateCode();

    // Generate a unique token for the URL
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 24; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    const timestamp = Date.now().toString(36);
    const token_value = `${result}-${timestamp}`;

    // Calculate expiration date
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expiry_days);

    // Create the invite
    const inviteData = {
      workspace_id,
      inviter_id: user.id,
      email: email || null, // Allow null for general invites
      role,
      function: teamFunction,
      token: token_value,
      status: "pending",
      expires_at: expires_at.toISOString(),
    };

    const insertResult = await supabaseServer
      .from("workspace_invites")
      .insert(inviteData)
      .select()
      .single();

    if (insertResult.error) {
      console.error("Insert error:", insertResult.error);
      return new Response(
        JSON.stringify({
          error: "Failed to create invite",
          details: insertResult.error.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Return the invite data with a full invite URL and code
    const inviteUrl = `${PUBLIC_SITE_URL}/invite/${token_value}`;

    return new Response(
      JSON.stringify({
        ...insertResult.data,
        code,
        inviteUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
