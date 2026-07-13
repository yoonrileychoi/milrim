-- ============================================================
-- MILRIM: milrim_plans에 AI 재계획 결과 저장 컬럼 추가
-- - ai_strategy: Solar가 재계획 시 생성한 한줄 코멘트 ("AI 메이트의 한 마디")
-- - generated_by: 이번 계획(초기 생성 또는 재계획)이 solar/fallback 중 무엇으로 만들어졌는지
-- 둘 다 NULL 허용(과거 행·초기 생성은 비어 있을 수 있음).
-- ============================================================

BEGIN;

ALTER TABLE public.milrim_plans
  ADD COLUMN IF NOT EXISTS ai_strategy TEXT;

ALTER TABLE public.milrim_plans
  ADD COLUMN IF NOT EXISTS generated_by TEXT
  CHECK (generated_by IS NULL OR generated_by IN ('solar', 'fallback'));

COMMIT;
