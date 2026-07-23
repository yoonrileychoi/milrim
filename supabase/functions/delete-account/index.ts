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
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // 본인 계정만 삭제 — body에서 userId를 받지 않는다 (권한 상승 차단)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 이 Supabase 프로젝트는 여러 사이트가 공유한다. auth.users 행을 지우면 같은
    // 계정으로 쓰던 다른 사이트 데이터까지 CASCADE로 삭제되므로, MILRIM 사용자
    // (milrim_profiles 보유자)일 때만 탈퇴를 허용한다. 아니면 거절한다.
    const { data: ownProfile, error: profileError } = await adminClient
      .from('milrim_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
    }
    if (!ownProfile) {
      return new Response(JSON.stringify({ error: 'Not a MILRIM user' }), { status: 404, headers: corsHeaders })
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
