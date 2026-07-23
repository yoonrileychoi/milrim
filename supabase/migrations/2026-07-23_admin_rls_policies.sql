-- ============================================================
-- MILRIM: 관리자 전체 조회 RLS 정책 (역기록)
--
-- 배경:
--   관리자 대시보드(AdminPage / AdminUserPlansPage)는 아래 3개 테이블을
--   user_id 필터 없이 전체 조회한다. 이 동작은 "관리자면 전체 조회 허용"
--   RLS 정책이 배포 DB에 존재해야만 가능하다. 그 정책은 devlog/2026-06-22.md
--   3-3절에 서술로만 남아 있고, schema.sql·기존 migrations 어디에도 SQL
--   원문이 없어(정책 유실 상태) 이 파일로 역기록한다.
--   대상 3개 테이블: milrim_profiles, milrim_plans, milrim_study_sessions
--   (milrim_plan_days에는 관리자 정책이 없음 — 일별 계획은 관리자도 열람 불가.
--    AdminUserPlansPage.tsx 주석과 일치.)
--
-- ✅ 배포 DB 대조 완료 (2026-07-24, pg_policies 실측):
--   milrim_profiles / milrim_plans / milrim_study_sessions 3개 테이블에
--   관리자 조회 정책이 실제로 존재하며, 셋 다 cmd=SELECT(읽기 전용)로 확인됨.
--   즉 FOR ALL로 잘못 만들어진(관리자가 남의 데이터 수정·삭제 가능) 상태가
--   아니다 — 보안 감사 [주의-1]의 우려는 해소됨.
--   이 파일은 그 배포 정책을 코드 저장소에 그대로 역기록한 문서다(정책 원문이
--   그동안 어디에도 없어 유실 상태였음).
--   아래 정책 이름·조건은 실측 결과와 동일하게 맞췄다.
--
--   조건식(devlog·배포 실측 일치):
--     auth.jwt() -> 'app_metadata' ->> 'milrim_role' = 'admin'
--   (app_metadata는 서비스 롤/대시보드로만 수정 가능 — 사용자가 스스로
--    admin이 될 수 없음.)
--
--   실행 여부: 배포 DB에 이미 동일 정책이 있으므로 이 파일을 다시 실행할
--   필요는 없다(기록용). 재실행해도 DROP ... IF EXISTS + 동일 CREATE라
--   결과가 바뀌지 않는다(idempotent). schema.sql에도 같은 내용을 추가해 둔다.
-- ============================================================

BEGIN;

-- ---------- milrim_profiles ----------
DROP POLICY IF EXISTS "관리자 전체 프로필 조회" ON public.milrim_profiles;
CREATE POLICY "관리자 전체 프로필 조회" ON public.milrim_profiles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'milrim_role' = 'admin');

-- ---------- milrim_plans ----------
DROP POLICY IF EXISTS "관리자 전체 플랜 조회" ON public.milrim_plans;
CREATE POLICY "관리자 전체 플랜 조회" ON public.milrim_plans
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'milrim_role' = 'admin');

-- ---------- milrim_study_sessions ----------
-- (배포 정책 이름이 "관리자 전체 세션 조회"라서 실측과 동일하게 맞춤)
DROP POLICY IF EXISTS "관리자 전체 세션 조회" ON public.milrim_study_sessions;
CREATE POLICY "관리자 전체 세션 조회" ON public.milrim_study_sessions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'milrim_role' = 'admin');

COMMIT;

-- ============================================================
-- 참고: 이 정책들은 기존의 "본인 한정" SELECT 정책과 공존한다.
--   Postgres RLS에서 같은 명령(SELECT)에 여러 PERMISSIVE 정책이 있으면 OR로
--   결합된다. 즉 일반 사용자는 "본인 것"만, 관리자(milrim_role=admin)는
--   본인 것 + 전체가 보인다. 그래서 관리자 계정에서 홈·계획 목록을 볼 때
--   남의 플랜까지 섞여 조회되므로, 클라이언트 코드는 .eq('user_id', user.id)로
--   본인 것만 명시 필터한다(HomePage.tsx·PlanListPage.tsx 주석 참고).
-- ============================================================
