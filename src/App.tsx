import { useEffect, useState } from "react";
import { BottomTabBar } from "./components/BottomTabBar";
import { useTodoAppStorage } from "./hooks/useTodoAppStorage";
import { useTodoTimer } from "./hooks/useTodoTimer";
import { RecordsPage } from "./pages/RecordsPage";
import { TimerPage } from "./pages/TimerPage";
import type { TimerSession } from "./types/session";
import type { Todo } from "./types/todo";
import type { TodoAppState } from "./types/todoAppState";
import { getSessionsByDate } from "./utils/sessionSelectors";
import { getLocalDateKey } from "./utils/time";
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
      id: Date.now(),
      title,
      completed: false,
      totalElapsedSec: 0,
    };

    setTodos((currentTodos) => [nextTodo, ...currentTodos]);
    setSelectedTodoId(nextTodo.id);

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
            onDurationChange={handleTimerDurationChange}
            onPause={handlePauseTimer}
            onReset={handleResetTimer}
            onSelectTodo={handleSelectTodo}
            onStart={handleStartTimer}
            onToggleTodo={handleToggleTodo}
            onUpdateTodo={handleUpdateTodo}
          />
        ) : (
          <RecordsPage sessions={sessions} />
        )}
      </div>
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}

export default App;
