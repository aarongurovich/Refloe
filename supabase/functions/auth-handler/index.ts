import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Define reusable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // 2. Handle the "Preflight" OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, action } = await req.json()
    console.log(`Processing action: ${action} for code: ${code?.substring(0, 5)}...`)

    const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET')
    const REDIRECT_URI = Deno.env.get('REDIRECT_URI')

    if (action !== 'google-login' || !code) {
      throw new Error('Invalid request parameters')
    }

    // 3. Exchange Auth Code for Tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("GOOGLE ERROR DETAIL:", JSON.stringify(tokenData));
      throw new Error(tokenData.error_description || tokenData.error || 'Bad Request');
    }

    // Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 4. BIG CHANGE: Let Supabase Auth handle the Google ID token!
    // This creates the user in `auth.users` AND gives us a valid Supabase session.
    const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokenData.id_token,
    })

    if (authError) {
      console.error("Supabase Auth Error:", authError)
      throw authError
    }

    // 5. Store the background sync tokens in your custom table.
    // We only update refresh_token if Google provided a new one, 
    // otherwise we might overwrite an existing valid one with null.
    const updatePayload: any = {
      id: authData.user.id, // Use the official Supabase Auth UUID
      email: authData.user.email,
      full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
      google_access_token: tokenData.access_token,
      last_login: new Date().toISOString()
    }

    if (tokenData.refresh_token) {
      updatePayload.refresh_token = tokenData.refresh_token;
    }

    const { error: dbError } = await supabase
      .from('users')
      .upsert(updatePayload, { onConflict: 'email' })

    if (dbError) {
      console.error("Database Upsert Error:", dbError)
      throw dbError
    }

    // 6. Return the native Supabase session to React!
    return new Response(JSON.stringify({ 
      user: authData.user,
      session: authData.session // React uses this for `supabase.auth.setSession()`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (err) {
    console.error("Critical Auth Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401 
    })
  }
})