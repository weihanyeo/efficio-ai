import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createCorsMiddleware } from '@supabase/functions/cors';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = createCorsMiddleware({
    allowedOrigins: ['http://localhost:4173'],  // Allow requests from localhost
    allowedHeaders: ['Authorization', 'Content-Type'],  // Allow Authorization header
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});
    
serve(async (req) => {
    // Handle CORS preflight request (OPTIONS)
    if (req.method === "OPTIONS") {
        return cors(req, new Response(null, { status: 204 }));
    }

    if (req.method !== "POST") {
        return cors(req, new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 }));
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return cors(req, new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }));

        const token = authHeader.replace("Bearer ", "");
        const { data: userSession, error: authError } = await supabase.auth.getUser(token);
        if (authError || !userSession?.user) {
            return cors(req, new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 }));
        }

        const { email } = await req.json();
        if (!email || email !== userSession.user.email) {
            return cors(req, new Response(JSON.stringify({ error: "Unauthorized action" }), { status: 403 }));
        }

        // Find user by email
        const { data: user, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (fetchError || !user) {
            return cors(req, new Response(JSON.stringify({ error: "User not found" }), { status: 404 }));
        }

        // Delete profile from the 'profiles' table
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", user.id);

        if (profileError) throw profileError;

        // Delete user from authentication
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (authDeleteError) throw authDeleteError;

        return cors(req, new Response(JSON.stringify({ message: "Account deleted successfully" }), { status: 200 }));
    } catch (err) {
        return cors(req, new Response(JSON.stringify({ error: err.message || "Something went wrong" }), { status: 500 }));
    }
});