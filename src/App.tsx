import { useEffect, useState } from "react";
import { ActiveTaskCard } from "./components/ActiveTaskCard";
import { SessionHistorySection } from "./components/SessionHistorySection";
import { SummarySection } from "./components/SummarySection";
import { TodoListSection } from "./components/TodoListSection";
import { useTodoAppStorage } from "./hooks/useTodoAppStorage";
import { useTodoTimer } from "./hooks/useTodoTimer";
import type { TimerSession } from "./types/session";
import type { Todo } from "./types/todo";
import type { TodoAppState } from "./types/todoAppState";
import {
  getSessionsByDate,
  getTotalSessionDuration,
} from "./utils/sessionSelectors";
import { buildSummaryCards, getCompletedCount } from "./utils/summary";
import { getLocalDateKey } from "./utils/time";
import { loadTodoAppState, sanitizeTodoAppState } from "./utils/todoStorage";
import { formatDuration } from "./utils/time";
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
  const [todos, setTodos] = useState(initialState.todos);
  const [sessions, setSessions] = useState<TimerSession[]>(
    initialState.sessions,
  );
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(
    initialState.selectedTodoId,
  );

  useEffect(() => {
    if (
      selectedTodoId !== null &&
      todos.some((todo) => todo.id === selectedTodoId)
    ) {
      return;
    }

    const fallbackTodo =
      todos.find((todo) => !todo.completed) ?? todos[0] ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTodoId(fallbackTodo?.id ?? null);
  }, [selectedTodoId, todos]);

  const {
    displayedElapsedById,
    displayedRemainingSec,
    activeRunElapsedSec,
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

  useTodoAppStorage(
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

  const completedCount = getCompletedCount(todos);
  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null;
  const runningTodo = todos.find((todo) => todo.id === runningTodoId) ?? null;
  const activeCardTodo = runningTodo ?? selectedTodo;
  const todaySessions = getSessionsByDate(sessions, getLocalDateKey(Date.now()));
  const todaySessionDurationSec = getTotalSessionDuration(todaySessions);
  const summaryCards = buildSummaryCards({
    activeTaskTitle: activeCardTodo?.title ?? null,
    completedCount,
    isRunning: runningTodoId !== null,
    todayFocusSec:
      runningTodoId !== null
        ? todaySessionDurationSec + activeRunElapsedSec
        : todaySessionDurationSec,
    totalCount: todos.length,
  });

  const handleAddTodo = (title: string) => {
    const nextTodo: Todo = {
      id: Date.now(),
      title,
      completed: false,
      totalElapsedSec: 0,
    };

    setTodos((currentTodos) => [nextTodo, ...currentTodos]);
    setSelectedTodoId(nextTodo.id);
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
  };

  const handleDeleteTodo = (id: number) => {
    handleRemoveTimerTarget(id);

    if (selectedTodoId === id) {
      setSelectedTodoId(null);
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  };

  const handleToggleTodo = (id: number) => {
    handleCompleteTimerTarget(id);

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
  };

  const handleSelectTodo = (id: number) => {
    setSelectedTodoId(id);
  };

  return (
    <main className="app">
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">TODO 타이머</p>
          <h1>할 일을 고르고, 집중한 시간을 기록하세요.</h1>
        </header>

        <SummarySection cards={summaryCards} />

        <ActiveTaskCard
          durationSeconds={timerDurationSec}
          isRunning={runningTodoId === activeCardTodo?.id}
          onDurationChange={handleTimerDurationChange}
          onPause={handlePauseTimer}
          onReset={handleResetTimer}
          onStart={handleStartTimer}
          remainingSeconds={displayedRemainingSec}
          remainingTime={formatDuration(displayedRemainingSec)}
          title={activeCardTodo?.title ?? "선택된 할 일이 없습니다"}
        />

        <TodoListSection
          displayedElapsedById={displayedElapsedById}
          runningTodoId={runningTodoId}
          selectedTodoId={selectedTodoId}
          todos={todos}
          onAddTodo={handleAddTodo}
          onDeleteTodo={handleDeleteTodo}
          onSelectTodo={handleSelectTodo}
          onToggleTodo={handleToggleTodo}
          onUpdateTodo={handleUpdateTodo}
        />

        <SessionHistorySection
          sessions={sessions}
          todaySessions={todaySessions}
        />
      </div>
    </main>
  );
}

export default App;
