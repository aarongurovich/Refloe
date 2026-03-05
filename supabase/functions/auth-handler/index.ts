// supabase/functions/auth-handler/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, action } = await req.json()

    // These variables are injected by Supabase and are SECURE
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'signup') {
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash: password }]) // Note: Implement hashing in the function for peak security
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ user: data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (action === 'login') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single()

      if (error || !data) throw new Error('Invalid credentials')
      return new Response(JSON.stringify({ user: data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})