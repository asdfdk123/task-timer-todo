import { useEffect, useState } from "react";
import { AppNotice } from "./components/AppNotice";
import { BottomTabBar } from "./components/BottomTabBar";
import { FeedbackCard } from "./components/FeedbackCard";
import { useTodoAppStorage } from "./hooks/useTodoAppStorage";
import { useTodoTimer } from "./hooks/useTodoTimer";
import { RecordsPage } from "./pages/RecordsPage";
import { TimerPage } from "./pages/TimerPage";
import type { TimerSession } from "./types/session";
import type { Todo } from "./types/todo";
import type { TodoAppState } from "./types/todoAppState";
import { trackEvent } from "./utils/analytics";
import { getSessionsByDate } from "./utils/sessionSelectors";
import { getLocalDateKey } from "./utils/time";
import { createTodoId } from "./utils/todoIds";
import { loadTodoAppState, sanitizeTodoAppState } from "./utils/todoStorage";
import "./App.css";

const initialTodos: Todo[] = [
  {
    id: 1,
    title: "프로젝트 개요 작성",
    completed: false,
    totalElapsedSec: 2720,
  },
  {
    id: 2,
    title: "메인 화면 레이아웃 정리",
    completed: true,
    totalElapsedSec: 4330,
  },
  {
    id: 3,
    title: "타이머 동작 흐름 설계",
    completed: false,
    totalElapsedSec: 1115,
  },
];

const fallbackState: TodoAppState = {
  todos: initialTodos,
  sessions: [],
  selectedTodoId:
    initialTodos.find((todo) => !todo.completed)?.id ??
    initialTodos[0]?.id ??
    null,
  runningTodoId: null,
  startedAt: null,
  activeSessionStartedAt: null,
  timerDurationSec: 25 * 60,
  timerRemainingSec: 25 * 60,
  todayFocusDateKey: getLocalDateKey(Date.now()),
  todayFocusSec: 0,
};

function App() {
  const [initialState] = useState(() => loadTodoAppState(fallbackState));
  const [activeTab, setActiveTab] = useState<"timer" | "records">("timer");
  const [todos, setTodos] = useState(initialState.todos);
  const [sessions, setSessions] = useState<TimerSession[]>(
    initialState.sessions,
  );
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(
    initialState.selectedTodoId,
  );

  useEffect(() => {
    trackEvent("app_opened");
  }, []);

  useEffect(() => {
    if (
      selectedTodoId !== null &&
      todos.some((todo) => todo.id === selectedTodoId)
    ) {
      return;
    }

    const fallbackTodo =
      todos.find((todo) => !todo.completed) ?? todos[0] ?? null;

    setSelectedTodoId(fallbackTodo?.id ?? null);
  }, [selectedTodoId, todos]);

  const {
    displayedElapsedById,
    displayedRemainingSec,
    displayedTodayFocusSec,
    activeSessionStartedAt,
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleResetTimer,
    handleStartTimer,
    handleTimerDurationChange,
    runningTodoId,
    startedAt,
    timerDurationSec,
    timerRemainingSec,
    todayFocusDateKey,
    todayFocusSec,
  } = useTodoTimer({
    initialRunningTodoId: initialState.runningTodoId,
    initialStartedAt: initialState.startedAt,
    initialActiveSessionStartedAt: initialState.activeSessionStartedAt,
    initialTimerDurationSec: initialState.timerDurationSec,
    initialTimerRemainingSec: initialState.timerRemainingSec,
    initialTodayFocusDateKey: initialState.todayFocusDateKey,
    initialTodayFocusSec: initialState.todayFocusSec,
    selectedTodoId,
    setSelectedTodoId,
    setSessions,
    setTodos,
    todos,
  });

  const { hasStorageError } = useTodoAppStorage(
    sanitizeTodoAppState({
      todos,
      sessions,
      selectedTodoId,
      runningTodoId,
      startedAt,
      activeSessionStartedAt,
      timerDurationSec,
      timerRemainingSec,
      todayFocusDateKey,
      todayFocusSec,
    }),
  );

  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null;
  const runningTodo = todos.find((todo) => todo.id === runningTodoId) ?? null;
  const activeCardTodo = runningTodo ?? selectedTodo;

  const todaySessions = getSessionsByDate(
    sessions,
    // eslint-disable-next-line react-hooks/purity
    getLocalDateKey(Date.now()),
  );

  const handleAddTodo = (title: string) => {
    const nextTodo: Todo = {
      id: createTodoId(todos.map((todo) => todo.id)),
      title,
      completed: false,
      totalElapsedSec: 0,
    };

    setTodos((currentTodos) => [nextTodo, ...currentTodos]);
    setSelectedTodoId(nextTodo.id);
    trackEvent("todo_created", {
      todoId: nextTodo.id,
    });

    return nextTodo.id;
  };

  const handleUpdateTodo = (id: number, title: string) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              title,
            }
          : todo,
      ),
    );
    trackEvent("todo_updated", {
      todoId: id,
    });
  };

  const handleDeleteTodo = (id: number) => {
    handleRemoveTimerTarget(id);
    trackEvent("todo_deleted", {
      todoId: id,
    });

    if (selectedTodoId === id) {
      setSelectedTodoId(null);
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  };

  const handleToggleTodo = (id: number) => {
    handleCompleteTimerTarget(id);
    const targetTodo = todos.find((todo) => todo.id === id);

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo,
      ),
    );
    trackEvent("todo_completed_toggled", {
      completed: !(targetTodo?.completed ?? false),
      todoId: id,
    });
  };

  const handleSelectTodo = (id: number) => {
    setSelectedTodoId(id);
  };

  const handleDurationChange = (durationSeconds: number) => {
    handleTimerDurationChange(durationSeconds);
    trackEvent("timer_duration_set", {
      durationMinutes: Math.round(durationSeconds / 60),
      hasSelectedTodo: selectedTodoId !== null,
    });
  };

  const handleStart = () => {
    if (activeCardTodo === null || activeCardTodo.completed) {
      return;
    }

    trackEvent("timer_started", {
      durationMinutes: Math.round(timerDurationSec / 60),
      todoId: activeCardTodo.id,
    });
    handleStartTimer();
  };

  const handlePause = () => {
    if (runningTodoId !== null) {
      trackEvent("timer_paused", {
        todoId: runningTodoId,
      });
    }

    handlePauseTimer();
  };

  const handleReset = () => {
    trackEvent("timer_reset", {
      hasSelectedTodo: activeCardTodo !== null,
      todoId: activeCardTodo?.id,
    });
    handleResetTimer();
  };

  const handleTabChange = (nextTab: "timer" | "records") => {
    if (nextTab === "records" && activeTab !== "records") {
      trackEvent("records_viewed", {
        sessionCount: sessions.length,
      });
    }

    setActiveTab(nextTab);
  };

  return (
    <main className="app">
      <div className="app-shell">
        {activeTab === "timer" ? (
          <TimerPage
            displayedElapsedById={displayedElapsedById}
            displayedRemainingSec={displayedRemainingSec}
            runningTodoId={runningTodoId}
            selectedTodo={activeCardTodo}
            selectedTodoId={selectedTodoId}
            sessionsTodayCount={todaySessions.length}
            timerDurationSec={timerDurationSec}
            todayFocusSec={displayedTodayFocusSec}
            todos={todos}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
            onDurationChange={handleDurationChange}
            onPause={handlePause}
            onReset={handleReset}
            onSelectTodo={handleSelectTodo}
            onStart={handleStart}
            onToggleTodo={handleToggleTodo}
            onUpdateTodo={handleUpdateTodo}
          />
        ) : (
          <RecordsPage sessions={sessions} />
        )}
        {hasStorageError ? (
          <AppNotice title="저장 상태를 확인해 주세요">
            브라우저 저장 공간에 현재 상태를 저장하지 못했어요. 저장 공간이 가득 찼거나 비공개 모드일 수 있습니다.
          </AppNotice>
        ) : null}
        <FeedbackCard />
      </div>
      <BottomTabBar activeTab={activeTab} onChange={handleTabChange} />
    </main>
  );
}

export default App;
