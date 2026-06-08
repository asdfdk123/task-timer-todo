# 집중 타이머

브라우저에서 바로 사용할 수 있는 한국어 중심의 로컬 TODO + 집중 타이머 앱입니다.

## 프로젝트 개요

이 앱은 해야 할 일을 정리하고, 한 번에 하나의 작업에만 집중 타이머를 실행하면서 실제 집중 시간을 세션 단위로 기록할 수 있도록 만든 앱입니다.

- 로컬 우선: 기본 데이터는 `localStorage`에 저장됩니다.
- 단일 작업 타이머: 동시에 여러 작업을 돌리지 않습니다.
- 기록 중심: 완료된 타이머는 날짜별/요일별 세션으로 누적됩니다.
- 선택 동기화 준비: Supabase 연결 구조를 별도로 준비해 두었습니다.

## 현재 구현된 기능

- 할 일 추가, 수정, 삭제
- 할 일 완료 토글
- `전체 / 미완료 / 완료` 필터
- 인터랙티브 원형 카운트다운 타이머
- 드래그/터치로 1분 단위 시간 설정
- 시작, 일시정지, 초기화, 완료 상태 분리
- 한 번에 하나의 작업만 실행
- 타이머 완료 시 세션 기록 생성
- 오늘 집중 시간, 이번 주 요약, 요일별 기록, 최근 날짜별 기록 화면
- 완료 사운드 on/off 설정
- 브라우저 알림 권한 요청 및 백그라운드 완료 알림
- localStorage 기반 상태 복원
- 기본 analytics 이벤트 추상화 구조
- Supabase 로그인 및 수동 동기화 준비 단계

## 기술 스택

- React
- TypeScript
- Vite
- CSS
- localStorage
- Notification API
- HTMLAudioElement
- Supabase JavaScript Client

## 실행 방법

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 린트

```bash
npm run lint
```

## 폴더 구조

```text
src/
  components/   화면 구성 컴포넌트
  hooks/        타이머, 저장, 인증 등 상태 로직
  lib/          외부 클라이언트 초기화
  pages/        타이머 화면, 기록 화면
  services/     Supabase auth / sync 서비스
  types/        앱 상태 및 DB 타입
  utils/        시간, 기록, 저장, analytics 유틸
supabase/
  migrations/   Supabase SQL migration 초안
docs/
  supabase-plan.md
```

## 핵심 동작 방식

- 타이머는 timestamp 기반으로 동작해 단순한 1초 누적보다 안정적으로 남은 시간을 계산합니다.
- `일시정지`는 현재까지의 진행 시간을 반영하고, `초기화`는 이번 진행 시간을 버리고 설정 시간으로 되돌립니다.
- `완료` 시에는 세션 기록이 생성되고, 날짜/요일 집계에 반영됩니다.
- 저장 데이터에는 `schemaVersion`이 포함되어 일부 필드가 깨져도 가능한 범위에서 복구를 시도합니다.

## Supabase 준비 상태

현재 앱은 로컬을 기준 저장소로 유지하면서, 로그인한 사용자가 자신의 데이터를 Supabase에 선택적으로 동기화할 수 있도록 1단계 준비가 되어 있습니다.

- 환경변수:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- 로그인 방식:
  - 이메일 매직 링크
- 준비된 테이블:
  - `todos`
  - `timer_sessions`
  - `user_settings`
- SQL / RLS 문서:
  - [docs/supabase-plan.md](./docs/supabase-plan.md)
  - [supabase/migrations/202605190001_initial_auth_schema.sql](./supabase/migrations/202605190001_initial_auth_schema.sql)

중요:

- 이번 단계에서도 로컬 데이터가 source of truth입니다.
- Supabase 연결이 없어도 앱은 정상 동작합니다.
- 실제 배포 전에는 반드시 RLS 정책을 적용해야 합니다.

## 현재 한계 / 다음 단계

- 서버 데이터를 내려받아 로컬과 병합하는 자동 sync는 아직 구현하지 않았습니다.
- 삭제 동기화는 tombstone 기반 정책으로 확장할 예정입니다.
- Supabase generated types, 소셜 로그인, 다중 기기 동기화는 다음 단계 후보입니다.
