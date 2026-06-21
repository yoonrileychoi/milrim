-- ============================================================
-- MILRIM 데이터베이스 스키마 (v2 — 점검 완료)
-- 실행 전 검토 후 Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ============================================================
-- 1. milrim_profiles (사용자 프로필)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milrim_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT        NOT NULL DEFAULT '사용자',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.milrim_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필 조회" ON public.milrim_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "본인 프로필 생성" ON public.milrim_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- WITH CHECK: 수정 후에도 본인 id여야 함 (id 변조 방지)
CREATE POLICY "본인 프로필 수정" ON public.milrim_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. milrim_plans (학습 목표/계획)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milrim_plans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  start_date     DATE        NOT NULL,
  end_date       DATE        NOT NULL,
  daily_minutes  INT         NOT NULL CHECK (daily_minutes > 0),
  unit           TEXT        NOT NULL CHECK (unit IN ('페이지', '문제', '강의', '기타')),
  total_amount   INT         NOT NULL CHECK (total_amount > 0),
  status         TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  replan_count   INT         NOT NULL DEFAULT 0 CHECK (replan_count >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.milrim_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 플랜 조회" ON public.milrim_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 플랜 생성" ON public.milrim_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITH CHECK: 수정 후에도 본인 user_id여야 함 (소유권 변조 방지)
CREATE POLICY "본인 플랜 수정" ON public.milrim_plans
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 플랜 삭제" ON public.milrim_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. milrim_plan_days (AI가 생성하는 일별 계획)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milrim_plan_days (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID        NOT NULL REFERENCES public.milrim_plans(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  target_amount   INT         NOT NULL CHECK (target_amount > 0),
  min_amount      INT         NOT NULL CHECK (min_amount > 0),
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'incomplete')),
  actual_amount   INT         CHECK (actual_amount >= 0),
  study_seconds   INT         NOT NULL DEFAULT 0 CHECK (study_seconds >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 같은 플랜에서 같은 날짜 중복 방지
  UNIQUE (plan_id, date)
);

ALTER TABLE public.milrim_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 일별 계획 조회" ON public.milrim_plan_days
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 일별 계획 생성" ON public.milrim_plan_days
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITH CHECK: 소유권 변조 방지
CREATE POLICY "본인 일별 계획 수정" ON public.milrim_plan_days
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 일별 계획 삭제" ON public.milrim_plan_days
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. milrim_study_sessions (타이머 기록)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milrim_study_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id          UUID        REFERENCES public.milrim_plans(id) ON DELETE SET NULL,
  plan_day_id      UUID        REFERENCES public.milrim_plan_days(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  duration_seconds INT         NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.milrim_study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 학습 세션 조회" ON public.milrim_study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 학습 세션 생성" ON public.milrim_study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITH CHECK: 소유권 변조 방지
CREATE POLICY "본인 학습 세션 수정" ON public.milrim_study_sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. 신규 유저 프로필 생성
-- ============================================================
-- 트리거 방식 사용 안 함.
-- 이유: 여러 사이트가 하나의 Supabase 프로젝트를 공유하므로,
--       auth.users INSERT 트리거를 걸면 다른 사이트 신규 가입자에게도
--       milrim_profiles 행이 생성되어 데이터가 섞임.
-- 대신 프론트엔드 AuthContext(fetchOrCreateNickname)에서
--       첫 MILRIM 로그인 시점에 프로필을 생성함.
--
-- 기존 트리거가 DB에 남아 있다면 아래 SQL로 제거:
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
