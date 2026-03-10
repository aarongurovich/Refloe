import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, action, userId, months } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'trigger-scan') {
      const lambdaUrl = Deno.env.get('LAMBDA_FETCHER_URL')
      const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
      const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
      const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'
      
      if (!lambdaUrl || !awsAccessKey || !awsSecretKey) {
        throw new Error("CRITICAL: Missing AWS configuration (LAMBDA_FETCHER_URL, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY)")
      }

      const awsClient = new AwsClient({
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
        region: awsRegion,
        service: 'lambda',
      })

      if (userId) {
        // --- 1. Targeted Onboarding Scan ---
        // Updates only the specific user joining the platform
        const { error: updateError } = await supabase
          .from('users')
          .update({ scan_history_months: months })
          .eq('id', userId)

        if (updateError) throw updateError

        // Directly invokes Lambda for this user
        const lambdaRes = await awsClient.fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        })
        
        if (!lambdaRes.ok) {
          const errorText = await lambdaRes.text()
          console.error(`Lambda rejected the request: ${errorText}`)
        }
      } else {
        // --- 2. Global Batch Scan ---
        // Updates scan history for ALL users in the table
        if (months !== undefined) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ scan_history_months: months })
            .not('id', 'is', null)

          if (updateError) console.error("Global update error:", updateError)
        }

        // Sending an empty body triggers the "Dispatcher Mode" in your Python handler, 
        // which sends all User IDs to the user-scan-queue
        const lambdaRes = await awsClient.fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) 
        })

        if (!lambdaRes.ok) {
          const errorText = await lambdaRes.text()
          console.error(`Lambda rejected the global request: ${errorText}`)
        }
      }

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (action === 'google-login') {
      const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')
      const GOOGLE_CLIENT_SECRET = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET')
      const REDIRECT_URI = Deno.env.get('REDIRECT_URI')

      if (!code) throw new Error('Missing authorization code')

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
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Google Auth Failed')

      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokenData.id_token,
      })

      if (authError) throw authError

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle()
        
      const isNewUser = !existingUser

      const updatePayload: any = {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
        google_access_token: tokenData.access_token,
        preferred_provider: 'google',
        last_login: new Date().toISOString()
      }

      if (tokenData.refresh_token) updatePayload.refresh_token = tokenData.refresh_token

      const { error: dbError } = await supabase
        .from('users')
        .upsert(updatePayload, { onConflict: 'email' })

      if (dbError) throw dbError

      return new Response(JSON.stringify({ 
        user: authData.user,
        session: authData.session,
        is_new_user: isNewUser
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (action === 'outlook-login') {
      const MS_CLIENT_ID = Deno.env.get('VITE_MICROSOFT_CLIENT_ID')
      const MS_CLIENT_SECRET = Deno.env.get('VITE_MICROSOFT_CLIENT_SECRET')
      const REDIRECT_URI = Deno.env.get('REDIRECT_URI')

      if (!code) throw new Error('Missing authorization code')

      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MS_CLIENT_ID!,
          scope: 'openid profile email Mail.Read offline_access',
          code: code!,
          redirect_uri: REDIRECT_URI!,
          grant_type: 'authorization_code',
          client_secret: MS_CLIENT_SECRET!,
        }),
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'MS Auth Failed')

      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'azure',
        token: tokenData.id_token,
      })

      if (authError) throw authError

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle()
        
      const isNewUser = !existingUser

      const updatePayload: any = {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
        outlook_access_token: tokenData.access_token,
        preferred_provider: 'outlook',
        last_login: new Date().toISOString()
      }

      if (tokenData.refresh_token) updatePayload.outlook_refresh_token = tokenData.refresh_token

      const { error: dbError } = await supabase
        .from('users')
        .upsert(updatePayload, { onConflict: 'email' })

      if (dbError) throw dbError

      return new Response(JSON.stringify({ 
        user: authData.user,
        session: authData.session,
        is_new_user: isNewUser
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    throw new Error('Invalid request parameters')

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401 
    })
  }
})