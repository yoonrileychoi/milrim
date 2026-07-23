import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.app_metadata?.milrim_role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 이 Supabase 프로젝트는 여러 사이트가 공유하므로, 대상 userId가 실제 MILRIM
    // 사용자(milrim_profiles 보유자)인지 먼저 확인한다. 확인하지 않으면 다른 사이트의
    // 계정까지 삭제될 수 있다.
    const { data: targetProfile, error: profileError } = await adminClient
      .from('milrim_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (profileError) {
      return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
    }
    if (!targetProfile) {
      return new Response(JSON.stringify({ error: 'Not a MILRIM user' }), { status: 404, headers: corsHeaders })
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
