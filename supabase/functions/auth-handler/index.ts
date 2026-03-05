import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

Deno.serve(async (req) => {
  // 1. Dynamic CORS setup to allow credentials (cookies)
  const origin = req.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true', 
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { idToken, action } = await req.json()
    const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')
    const JWT_SECRET = new TextEncoder().encode(Deno.env.get('SESSION_JWT_SECRET'))

    if (action !== 'google-login' || !idToken) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders })
    }

    // 2. Verify Google Token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!googleRes.ok) throw new Error('Google token verification failed')
    const payload = await googleRes.json()

    if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Audience mismatch')

    // 3. Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Upsert into public.users
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

    // 5. Create secure Session JWT
    const sessionToken = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // 6. Environment-Aware Cookie Configuration
    // Detect if we are in a local development environment
    const isLocal = Deno.env.get('SUPABASE_URL')?.includes('localhost') || 
                    Deno.env.get('SUPABASE_URL')?.includes('127.0.0.1');

    // SameSite=None is required for cross-site cookies (Local dev usually uses different ports)
    // SameSite=Lax is standard for production apps on the same/related domains
    const sameSite = isLocal ? 'None' : 'Lax';
    const secure = 'Secure'; // Always use Secure; required by browsers if SameSite=None

    const cookie = `trackr_session=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=${sameSite}; ${secure}`;

    return new Response(JSON.stringify({ user }), { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': cookie 
      },
      status: 200 
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401 
    })
  }
})