import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profilesData } = await supabase
      .from('milrim_profiles')
      .select('id, nickname, created_at')

    const { data: authData, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), { status: 400, headers: corsHeaders })
    }

    const profileMap = new Map((profilesData || []).map(p => [p.id, p]))

    const milrimUserIds = new Set((profilesData || []).map(p => p.id))

    const users = authData.users
      .filter(u => milrimUserIds.has(u.id) || u.app_metadata?.milrim_role === 'admin')
      .map(u => {
        const profile = profileMap.get(u.id)
        return {
          id: u.id,
          nickname: profile?.nickname || u.user_metadata?.name || '사용자',
          email: u.email || '',
          created_at: u.created_at,
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return new Response(JSON.stringify({ users }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
