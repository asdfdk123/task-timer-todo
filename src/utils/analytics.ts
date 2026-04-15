type AnalyticsEventMap = {
  app_opened: undefined
  feedback_clicked: undefined
  records_viewed: {
    sessionCount: number
  }
  timer_completed: {
    durationMinutes: number
    todoId: number
  }
  timer_duration_set: {
    durationMinutes: number
    hasSelectedTodo: boolean
  }
  timer_paused: {
    todoId: number
  }
  timer_reset: {
    hasSelectedTodo: boolean
    todoId?: number
  }
  timer_started: {
    durationMinutes: number
    todoId: number
  }
  todo_completed_toggled: {
    completed: boolean
    todoId: number
  }
  todo_created: {
    todoId: number
  }
  todo_deleted: {
    todoId: number
  }
  todo_updated: {
    todoId: number
  }
}

export type AnalyticsEventName = keyof AnalyticsEventMap

export type AnalyticsEventPayload<TEventName extends AnalyticsEventName> =
  AnalyticsEventMap[TEventName]

type AnalyticsProvider = <TEventName extends AnalyticsEventName>(
  eventName: TEventName,
  payload: AnalyticsEventPayload<TEventName>,
) => void

const consoleAnalyticsProvider: AnalyticsProvider = (eventName, payload) => {
  if (typeof console === 'undefined') {
    return
  }

  console.info('[analytics]', eventName, payload ?? {})
}

let analyticsProvider: AnalyticsProvider = consoleAnalyticsProvider

export function setAnalyticsProvider(provider: AnalyticsProvider) {
  analyticsProvider = provider
}

export function trackEvent<TEventName extends AnalyticsEventName>(
  eventName: TEventName,
  ...payload: AnalyticsEventPayload<TEventName> extends undefined
    ? []
    : [AnalyticsEventPayload<TEventName>]
) {
  analyticsProvider(eventName, payload[0] as AnalyticsEventPayload<TEventName>)
}
