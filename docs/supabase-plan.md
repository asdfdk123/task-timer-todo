# Supabase 연동 준비 메모

현재 앱은 `localStorage`를 기준 저장소로 사용합니다.  
Supabase는 로그인한 사용자가 자신의 할 일, 타이머 세션, 설정을 선택적으로 동기화할 수 있도록 붙이는 단계별 확장 레이어입니다.

## 1. 현재 적용 상태

- `@supabase/supabase-js` 클라이언트 연결 준비
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 기반 optional client
- 이메일 매직 링크 로그인 UI 초안
- 로그인 후 수동 동기화 버튼
- `todos`, `timer_sessions`, `user_settings` 타입 및 서비스 레이어 초안
- SQL migration + RLS 정책 초안 추가

환경변수가 없거나 Supabase 연결에 실패해도 앱은 기존처럼 로컬에서 계속 동작합니다.

## 2. 환경변수

`.env.local` 예시:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_SUPABASE_URL`에는 `https://<project-ref>.supabase.co` 형태의 **베이스 URL만** 넣습니다.  
`/rest/v1` 경로까지 붙이면 안 됩니다.

## 3. SQL / RLS 적용 위치

- migration 파일: [supabase/migrations/202605190001_initial_auth_schema.sql](../supabase/migrations/202605190001_initial_auth_schema.sql)

이 파일에는 아래가 포함됩니다.

- `todos`
- `timer_sessions`
- `user_settings`
- `updated_at` trigger
- 각 테이블의 RLS 활성화
- `auth.uid() = user_id` 기준 select / insert / update / delete 정책

## 4. 인증 방식 선택

현재 앱에는 **이메일 매직 링크** 방식이 더 잘 맞습니다.

이유:

- 개인 생산성 앱이라 비밀번호 관리 부담이 적은 편이 UX에 유리함
- 최소 UI로도 로그인 흐름을 제공할 수 있음
- 추후 소셜 로그인이나 이메일/비밀번호를 추가해도 구조를 크게 바꾸지 않아도 됨

## 5. 동기화 정책

이번 단계에서는 로컬이 source of truth이고, 서버 동기화는 **수동 push**만 제공합니다.

- 로그인 전: 로컬만 사용
- 로그인 후: 사용자가 `지금 서버에 동기화` 버튼을 눌렀을 때만 업로드
- 업로드 대상:
  - 할 일 목록
  - 타이머 세션 기록
  - 완료 사운드 / 알림 opt-in 설정

### 다음 단계 병합 정책

로그인 직후 또는 여러 기기 동기화 단계에서는 아래 정책을 기준으로 병합할 계획입니다.

1. `updated_at`이 더 최신인 레코드를 우선 적용
2. `timer_sessions`는 append-only 성격으로 보고 `id` 기준 중복만 제거
3. `todos`와 `user_settings`는 동일 키 충돌 시 최신 `updated_at` 우선

### 삭제 정책

현재는 단순 정책으로 설계합니다.

- 로컬 삭제는 당장 자동 서버 삭제로 연결하지 않음
- 이후 단계에서 `deleted_at` 또는 tombstone 필드를 도입해 안전하게 처리
- 이번 단계에서는 잘못된 대량 삭제가 서버에 즉시 전파되지 않도록 보수적으로 유지

## 6. 다음 단계 제안

1. 로그인 직후 서버 데이터 fetch
2. 로컬/서버 병합 selector 추가
3. 수동 sync 외에 background sync 타이밍 정의
4. 삭제 tombstone 설계
5. 필요 시 `Database` 타입을 Supabase generated types로 교체
