-- ============================================================
-- MILRIM: Solar 일일 코치 메시지
--
-- 1) milrim_daily_messages 테이블 — 매일 자정(KST) milrim-coach Edge Function이
--    Solar로 생성한 세그먼트별 메시지 16종을 저장한다.
--    개인 데이터가 아니라 "그날의 세그먼트별 공용 문구"라서 모든 로그인
--    사용자가 읽을 수 있고, 쓰기는 Edge Function(서비스 롤)만 한다.
-- 2) pg_cron 스케줄 — 매일 UTC 15:00(KST 00:00)에 Edge Function 호출.
--
-- ⚠️ 실행 전에 아래 2곳의 자리표시자를 바꿔야 한다:
--    <PROJECT_REF>  : Supabase 프로젝트 참조 ID (대시보드 URL의 xxxx.supabase.co 부분)
--    <CRON_SECRET>  : 임의의 긴 무작위 문자열.
--                     같은 값을 Edge Function Secrets에 CRON_SECRET 이름으로도 등록할 것.
--                     (Dashboard → Edge Functions → Secrets)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.milrim_daily_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE        NOT NULL,
  segment    TEXT        NOT NULL CHECK (segment IN (
    'standard_high', 'standard_mid', 'standard_low', 'standard_min',
    'steady_high', 'steady_mid', 'steady_low', 'steady_min',
    'burst_high', 'burst_mid', 'burst_low', 'burst_min',
    'warmup', 'comeback', 'deadline', 'no_plan'
  )),
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (date, segment)
);

ALTER TABLE public.milrim_daily_messages ENABLE ROW LEVEL SECURITY;

-- 읽기: 로그인 사용자 전체 (공용 문구, 개인정보 없음)
CREATE POLICY "로그인 사용자 일일 메시지 조회" ON public.milrim_daily_messages
  FOR SELECT TO authenticated USING (true);

-- 쓰기 정책은 만들지 않는다 — 서비스 롤(Edge Function)만 INSERT/UPDATE 가능.

COMMIT;

-- ============================================================
-- pg_cron 스케줄 등록 (위 트랜잭션과 분리 실행 가능)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 기존 동명 스케줄이 있으면 제거 후 재등록
SELECT cron.unschedule('milrim-daily-coach')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'milrim-daily-coach');

SELECT cron.schedule(
  'milrim-daily-coach',
  '0 15 * * *',  -- UTC 15:00 = KST 00:00
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/milrim-coach',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
