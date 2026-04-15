type TimerFeedbackSettingsProps = {
  isSoundEnabled: boolean
  notificationPermission: 'unsupported' | NotificationPermission
  onRequestNotificationPermission: () => void
  onToggleSound: (enabled: boolean) => void
}

function getNotificationDescription(permission: TimerFeedbackSettingsProps['notificationPermission']) {
  if (permission === 'granted') {
    return '브라우저 알림이 켜져 있어요. 앱을 보지 않는 동안 완료되면 알림을 보내요.'
  }

  if (permission === 'denied') {
    return '브라우저에서 알림이 차단되어 있어요. 브라우저 설정에서 다시 허용할 수 있습니다.'
  }

  if (permission === 'unsupported') {
    return '이 브라우저에서는 완료 알림을 지원하지 않아요.'
  }

  return '원할 때만 권한을 요청합니다. 켜면 백그라운드에서도 완료를 알아차릴 수 있어요.'
}

export function TimerFeedbackSettings({
  isSoundEnabled,
  notificationPermission,
  onRequestNotificationPermission,
  onToggleSound,
}: TimerFeedbackSettingsProps) {
  const canRequestNotification = notificationPermission === 'default'

  return (
    <section className="timer-feedback-settings panel" aria-label="완료 알림 설정">
      <div className="section-heading">
        <p className="section-label">완료 알림</p>
        <h2>타이머 완료를 놓치지 않게</h2>
      </div>

      <div className="setting-row">
        <div>
          <strong>완료 사운드</strong>
          <p>타이머가 끝나면 짧은 알림음을 재생합니다.</p>
        </div>
        <button
          type="button"
          className={isSoundEnabled ? 'setting-toggle active' : 'setting-toggle'}
          aria-pressed={isSoundEnabled}
          onClick={() => onToggleSound(!isSoundEnabled)}
        >
          {isSoundEnabled ? '켜짐' : '꺼짐'}
        </button>
      </div>

      <div className="setting-row">
        <div>
          <strong>브라우저 알림</strong>
          <p>{getNotificationDescription(notificationPermission)}</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={!canRequestNotification}
          onClick={onRequestNotificationPermission}
        >
          {notificationPermission === 'granted'
            ? '허용됨'
            : notificationPermission === 'denied'
              ? '차단됨'
              : notificationPermission === 'unsupported'
                ? '미지원'
                : '알림 켜기'}
        </button>
      </div>
    </section>
  )
}
