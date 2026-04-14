import { useEffect, useState } from "react";
import { ActiveTaskCard } from "./components/ActiveTaskCard";
import { SummarySection } from "./components/SummarySection";
import { TodoListSection } from "./components/TodoListSection";
import { useTodoAppStorage } from "./hooks/useTodoAppStorage";
import { useTodoTimer } from "./hooks/useTodoTimer";
import type { Todo } from "./types/todo";
import type { TodoAppState } from "./types/todoAppState";
import { buildSummaryCards, getCompletedCount } from "./utils/summary";
import { getLocalDateKey } from "./utils/time";
import { loadTodoAppState, sanitizeTodoAppState } from "./utils/todoStorage";
import { formatDuration } from "./utils/time";
import "./App.css";

const initialTodos: Todo[] = [
  {
    id: 1,
    title: "Write project outline",
    completed: false,
    totalElapsedSec: 2720,
  },
  {
    id: 2,
    title: "Design main screen layout",
    completed: true,
    totalElapsedSec: 4330,
  },
  {
    id: 3,
    title: "Prepare timer interaction flow",
    completed: false,
    totalElapsedSec: 1115,
  },
];

const fallbackState: TodoAppState = {
  todos: initialTodos,
  selectedTodoId:
    initialTodos.find((todo) => !todo.completed)?.id ??
    initialTodos[0]?.id ??
    null,
  runningTodoId: null,
  startedAt: null,
  todayFocusDateKey: getLocalDateKey(Date.now()),
  todayFocusSec: 0,
};

function App() {
  const [initialState] = useState(() => loadTodoAppState(fallbackState));
  const [todos, setTodos] = useState(initialState.todos);
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
    displayedTodayFocusSec,
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleStartTimer,
    handleStopTimer,
    runningTodoId,
    startedAt,
    todayFocusDateKey,
    todayFocusSec,
  } = useTodoTimer({
    initialRunningTodoId: initialState.runningTodoId,
    initialStartedAt: initialState.startedAt,
    initialTodayFocusDateKey: initialState.todayFocusDateKey,
    initialTodayFocusSec: initialState.todayFocusSec,
    selectedTodoId,
    setSelectedTodoId,
    setTodos,
    todos,
  });

  useTodoAppStorage(
    sanitizeTodoAppState({
      todos,
      selectedTodoId,
      runningTodoId,
      startedAt,
      todayFocusDateKey,
      todayFocusSec,
    }),
  );

  const completedCount = getCompletedCount(todos);
  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null;
  const runningTodo = todos.find((todo) => todo.id === runningTodoId) ?? null;
  const activeCardTodo = runningTodo ?? selectedTodo;
  const summaryCards = buildSummaryCards({
    activeTaskTitle: activeCardTodo?.title ?? null,
    completedCount,
    isRunning: runningTodoId !== null,
    todayFocusSec: displayedTodayFocusSec,
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

  const activeElapsed = activeCardTodo
    ? (displayedElapsedById[activeCardTodo.id] ??
      activeCardTodo.totalElapsedSec)
    : 0;

  return (
    <main className="app">
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">TODO Timer App</p>
          <h1>Focus on one task while keeping the whole list in view.</h1>
        </header>

        <SummarySection cards={summaryCards} />

        <ActiveTaskCard
          elapsedTime={formatDuration(activeElapsed)}
          isRunning={runningTodoId === activeCardTodo?.id}
          onPause={handlePauseTimer}
          onStart={handleStartTimer}
          onStop={handleStopTimer}
          title={activeCardTodo?.title ?? "No active task selected"}
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
      </div>
    </main>
  );
}

export default App;
