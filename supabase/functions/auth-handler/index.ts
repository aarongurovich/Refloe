import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { idToken, action } = await req.json()
    const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')
    const JWT_SECRET = new TextEncoder().encode(Deno.env.get('SESSION_JWT_SECRET'))

    if (action !== 'google-login' || !idToken) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders })
    }

    // 1. Verify Google Token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!googleRes.ok) throw new Error('Google token verification failed')
    const payload = await googleRes.json()

    if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Audience mismatch')

    // 2. Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Upsert into public.users
    const { data: user, error: dbError } = await supabase
      .from('users')
      .upsert({ 
        email: payload.email,
        google_id: payload.sub,
        full_name: payload.name,
        avatar_url: payload.picture,
        last_login: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single()

    if (dbError) throw dbError

    // 4. Create secure Session JWT
    const sessionToken = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    return new Response(JSON.stringify({ user, sessionToken }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401 
    })
  }
})