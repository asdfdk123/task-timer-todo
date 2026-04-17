import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { COMPLETION_SOUND_SRC, COMPLETION_SOUND_VOLUME } from '../utils/soundConfig'

const SOUND_SETTING_KEY = 'todo-timer-completion-sound-enabled'

type CompletionFeedbackDetails = {
  durationMinutes: number
  todoTitle: string
}

type NotificationPermissionState = 'unsupported' | NotificationPermission

function getStoredSoundEnabled() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.localStorage.getItem(SOUND_SETTING_KEY) !== 'false'
}

function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  return window.Notification.permission
}

function createCompletionAudio() {
  if (typeof window === 'undefined') {
    return null
  }

  const audio = new Audio(COMPLETION_SOUND_SRC)
  audio.preload = 'auto'
  audio.volume = COMPLETION_SOUND_VOLUME

  return audio
}

function getCompletionAudio(audioRef: MutableRefObject<HTMLAudioElement | null>) {
  audioRef.current ??= createCompletionAudio()

  return audioRef.current
}

export function useTimerCompletionFeedback() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const [isSoundEnabled, setIsSoundEnabled] = useState(getStoredSoundEnabled)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(getNotificationPermission)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SOUND_SETTING_KEY, String(isSoundEnabled))
  }, [isSoundEnabled])

  useEffect(() => {
    audioRef.current = createCompletionAudio()

    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
      }

      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const primeCompletionSound = async () => {
    if (!isSoundEnabled) {
      return
    }

    const audio = getCompletionAudio(audioRef)

    if (!audio) {
      return
    }

    try {
      const originalVolume = audio.volume
      audio.load()
      audio.volume = 0
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      audio.volume = originalVolume || COMPLETION_SOUND_VOLUME
    } catch {
      audio.volume = COMPLETION_SOUND_VOLUME
      return
    }
  }

  const playCompletionSound = async () => {
    if (!isSoundEnabled) {
      return
    }

    const audio = getCompletionAudio(audioRef)

    if (!audio) {
      return
    }

    try {
      audio.pause()
      audio.currentTime = 0
      audio.volume = COMPLETION_SOUND_VOLUME
      await audio.play()
    } catch {
      return
    }
  }

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      return 'unsupported'
    }

    try {
      const nextPermission = await window.Notification.requestPermission()
      setNotificationPermission(nextPermission)
      return nextPermission
    } catch {
      setNotificationPermission(window.Notification.permission)
      return window.Notification.permission
    }
  }

  const notifyCompletion = (details: CompletionFeedbackDetails) => {
    const message = `"${details.todoTitle}" ${details.durationMinutes}분 집중이 완료됐어요.`

    setCompletionMessage(message)
    void playCompletionSound()

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = window.setTimeout(() => {
      setCompletionMessage(null)
    }, 5200)

    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden' &&
      notificationPermission === 'granted'
    ) {
      try {
        new window.Notification('집중 시간이 끝났어요', {
          body: message,
          tag: 'task-timer-completed',
        })
      } catch {
        return
      }
    }
  }

  return {
    completionMessage,
    isSoundEnabled,
    notificationPermission,
    notifyCompletion,
    primeCompletionSound,
    requestNotificationPermission,
    setIsSoundEnabled,
  }
}
