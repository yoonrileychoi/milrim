-- ============================================================
-- MILRIM: milrim_plans.unit CHECK 제약에 '시간' 추가
-- 실행 전 아래 조회로 현재 제약 이름(conname)을 확인할 것:
--
--   SELECT conname, pg_get_constraintdef(oid) AS def
--   FROM pg_constraint
--   WHERE conrelid = 'public.milrim_plans'::regclass AND contype = 'c';
--
-- 기본 자동 생성 이름은 milrim_plans_unit_check 이다.
-- 이름이 다르면 아래 DROP CONSTRAINT의 이름을 조회 결과로 교체한다.
-- ============================================================

BEGIN;

ALTER TABLE public.milrim_plans
  DROP CONSTRAINT IF EXISTS milrim_plans_unit_check;

ALTER TABLE public.milrim_plans
  ADD CONSTRAINT milrim_plans_unit_check
  CHECK (unit IN ('페이지', '문제', '강의', '시간', '기타'));

COMMIT;
