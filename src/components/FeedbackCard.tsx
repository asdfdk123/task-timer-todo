import { useState } from "react";
import { trackEvent } from "../utils/analytics";

const FEEDBACK_TEMPLATE = `수정 요청:

어떤 화면에서 문제가 있었나요?
-

무엇이 불편했나요?
-

기대하는 동작은 무엇인가요?
-`;

type FeedbackStatus = "idle" | "copied" | "failed";

export function FeedbackCard() {
  const [status, setStatus] = useState<FeedbackStatus>("idle");

  const handleCopyFeedbackTemplate = async () => {
    trackEvent("feedback_clicked");

    if (typeof navigator.clipboard?.writeText !== "function") {
      setStatus("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(FEEDBACK_TEMPLATE);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <section
      className="feedback-card panel"
      aria-label="개발자에게 수정 요청하기"
    >
      <div>
        <span className="section-label">피드백</span>
        <br />
        <strong>개발자에게 수정 요청하기</strong>
        <p>불편한 점을 발견했다면 요청 양식을 복사해 전달해 주세요.</p>
      </div>
      <button
        type="button"
        className="secondary-button"
        onClick={handleCopyFeedbackTemplate}
      >
        수정 요청 양식 복사
      </button>
      {status === "copied" ? (
        <p className="feedback-message" role="status">
          요청 양식을 복사했어요. 메신저나 이슈에 붙여넣어 보내주세요.
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="feedback-message" role="status">
          복사가 지원되지 않는 환경이에요. 불편한 화면과 기대 동작을 직접 적어
          전달해 주세요.
        </p>
      ) : null}
    </section>
  );
}
