import { useMemo, useState, type FormEvent } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { syncLocalStateToSupabase } from "../services/supabaseSync";
import type { TodoAppState } from "../types/todoAppState";

type SyncStatusTone = "error" | "info" | "success";

type SyncStatus = {
  message: string;
  tone: SyncStatusTone;
};

type SupabaseSyncCardProps = {
  completionSoundEnabled: boolean;
  notificationOptIn: boolean;
  state: TodoAppState;
};

function getResultErrorMessage(error?: string) {
  if (!error) {
    return "알 수 없는 오류";
  }

  return error;
}

export function SupabaseSyncCard({
  completionSoundEnabled,
  notificationOptIn,
  state,
}: SupabaseSyncCardProps) {
  const {
    configIssue,
    isConfigured,
    isLoading,
    isSendingLink,
    isSigningOut,
    requestMagicLink,
    signOut,
    user,
  } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [authStatus, setAuthStatus] = useState<SyncStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const summaryText = useMemo(
    () => `할 일 ${state.todos.length}개, 세션 ${state.sessions.length}개`,
    [state.sessions.length, state.todos.length],
  );

  const handleSubmitMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setAuthStatus({
        tone: "error",
        message: "로그인 링크를 받을 이메일 주소를 입력해 주세요.",
      });
      return;
    }

    const result = await requestMagicLink(trimmedEmail);
    setAuthStatus({
      tone: result.ok ? "success" : "error",
      message: result.message,
    });

    if (result.ok) {
      setEmail("");
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    setAuthStatus({
      tone: result.ok ? "info" : "error",
      message: result.message,
    });
  };

  const handleSync = async () => {
    if (!user) {
      setSyncStatus({
        tone: "error",
        message: "먼저 로그인한 뒤 서버 동기화를 진행해 주세요.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const result = await syncLocalStateToSupabase(state, user.id, {
        completionSoundEnabled,
        notificationOptIn,
      });

      const failedEntries = Object.entries(result).filter(
        ([, value]) => value && !value.ok && !value.skipped,
      );

      if (failedEntries.length > 0) {
        const firstFailure = failedEntries[0];
        setSyncStatus({
          tone: "error",
          message: `${firstFailure[0]} 동기화에 실패했어요: ${getResultErrorMessage(
            firstFailure[1]?.error,
          )}`,
        });
        return;
      }

      setSyncStatus({
        tone: "success",
        message: `${summaryText}를 Supabase에 동기화했어요.`,
      });
    } catch {
      setSyncStatus({
        tone: "error",
        message:
          "서버와 동기화하는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section
      className="supabase-sync-card panel"
      aria-label="Supabase 로그인과 동기화"
    >
      <div className="supabase-sync-header">
        <span className="section-label">선택 동기화</span>
        <strong>이메일 인증으로 데이터 저장</strong>
        <p>
          로그인하지 않아도 이 앱은 계속 로컬에서 사용할 수 있어요. 로그인하면
          지금 상태를 내 데이터를 선택적으로 동기화할 수 있어요.
        </p>
      </div>

      {!isConfigured ? (
        <div className="supabase-status-card">
          <strong>연결 정보가 아직 없어요</strong>
          <p>
            {configIssue ??
              "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하면 로그인과 서버 동기화를 사용할 수 있어요."}
          </p>
        </div>
      ) : null}

      {isConfigured && user === null ? (
        <form className="supabase-auth-form" onSubmit={handleSubmitMagicLink}>
          <label className="supabase-field">
            <span>이메일로 로그인</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="로그인 링크를 받을 이메일 주소"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setAuthStatus(null);
              }}
              disabled={isSendingLink || isLoading}
            />
          </label>
          <div className="supabase-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isSendingLink || isLoading}
            >
              {isSendingLink ? "링크 보내는 중..." : "매직 링크 보내기"}
            </button>
          </div>
          <p className="supabase-help">
            비밀번호 없이 메일의 로그인 링크로 들어오는 방식이에요.
          </p>
        </form>
      ) : null}

      {isConfigured && user !== null ? (
        <div className="supabase-authenticated">
          <div className="supabase-user-summary">
            <span className="section-label">로그인 상태</span>
            <strong>{user.email ?? "로그인된 사용자"}</strong>
            <p>{summaryText}가 현재 로컬에 저장되어 있어요.</p>
          </div>
          <div className="supabase-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? "동기화 중..." : "지금 서버에 동기화"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
          <p className="supabase-help">
            이번 단계에서는 로컬 상태가 기준이며, 서버 동기화는 수동으로만
            진행돼요.
          </p>
        </div>
      ) : null}

      {authStatus ? (
        <p
          className={`supabase-inline-message ${authStatus.tone}`}
          role="status"
        >
          {authStatus.message}
        </p>
      ) : null}
      {syncStatus ? (
        <p
          className={`supabase-inline-message ${syncStatus.tone}`}
          role="status"
        >
          {syncStatus.message}
        </p>
      ) : null}
    </section>
  );
}
