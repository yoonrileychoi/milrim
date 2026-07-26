-- ============================================================
-- MILRIM: 계획 생성 분배 방식 + AI 코멘트 출처 컬럼 추가
-- - distribution_pattern: 사용자가 고른 학습량 배분 모양
--     'even'  = 고르게 (매일 비슷하게) — 기본값
--     'front' = 초반집중 (앞이 무겁게)
--     'back'  = 후반집중 (뒤가 무겁게)
--   기존 행·기본값은 'even'.
-- - ai_comment_by: "AI 메이트의 한 마디" 코멘트를 무엇으로 만들었는지
--     'solar'    = Solar가 실제로 작성 (→ "Powered by Solar" 배지 표시)
--     'fallback' = Solar 실패 시 정적 문구 (→ 배지 숨김, 표기·구현 일치)
--   NULL 허용(과거 행·재계획 코멘트는 비어 있을 수 있으며, 이 경우 기존처럼 배지 표시).
-- ============================================================

BEGIN;

ALTER TABLE public.milrim_plans
  ADD COLUMN IF NOT EXISTS distribution_pattern TEXT NOT NULL DEFAULT 'even'
  CHECK (distribution_pattern IN ('front', 'back', 'even'));

ALTER TABLE public.milrim_plans
  ADD COLUMN IF NOT EXISTS ai_comment_by TEXT
  CHECK (ai_comment_by IS NULL OR ai_comment_by IN ('solar', 'fallback'));

COMMIT;

-- 되돌리기(필요 시):
-- ALTER TABLE public.milrim_plans DROP COLUMN IF EXISTS distribution_pattern;
-- ALTER TABLE public.milrim_plans DROP COLUMN IF EXISTS ai_comment_by;
