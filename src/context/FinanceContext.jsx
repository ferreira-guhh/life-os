import { createContext, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const FinanceContext = createContext(null);

export const CATEGORIES = [
  { id: 'essencial', label: 'Essencial', color: '#818cf8' },
  { id: 'educacao', label: 'Educação', color: '#fbbf24' },
  { id: 'lazer', label: 'Lazer', color: '#f472b6' },
  { id: 'saude', label: 'Saúde', color: '#34d399' },
  { id: 'investimento', label: 'Investimento', color: '#a78bfa' },
  { id: 'outros', label: 'Outros', color: '#94a3b8' }
];

const DEFAULT_TASKS = [
  { id: 1, time: "06:00", label: "Acordar & Exercitar", done: false },
  { id: 2, time: "08:00", label: "Estudar / Deep Work", done: false },
  { id: 3, time: "12:00", label: "Almoço & Pausa", done: false },
  { id: 4, time: "14:00", label: "Reuniões / Tarefas", done: false },
  { id: 5, time: "18:00", label: "Review do dia", done: false },
];

const DEFAULT_TRANSACTIONS = [
  { id: 1, label: "Salário", type: "income", category: "outros", expected: 5000, actual: 5000, date: "2026-03-30" },
  { id: 2, label: "Aluguel", type: "expense", category: "essencial", expected: 1500, actual: 1500, date: "2026-03-01" },
  { id: 3, label: "Alimentação", type: "expense", category: "essencial", expected: 800, actual: 950, date: "2026-03-28" },
  { id: 4, label: "Transporte", type: "expense", category: "essencial", expected: 300, actual: 280, date: "2026-03-29" },
];

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useLocalStorage(
    "lifeos_transactions",
    DEFAULT_TRANSACTIONS
  );
  const [tasks, setTasks] = useLocalStorage("lifeos_tasks", DEFAULT_TASKS);

  const addTransaction = useCallback(
    (tx) => {
      setTransactions((prev) => [
        ...prev, 
        { 
          ...tx, 
          id: Date.now(), 
          date: new Date().toISOString().split('T')[0] // Salva ex: "2026-03-30"
        }
      ]);
    },
    [setTransactions]
  );

  const removeTransaction = useCallback(
    (id) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [setTransactions]
  );

  const toggleTask = useCallback(
    (id) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    },
    [setTasks]
  );

  const addTask = useCallback(
    (task) => {
      setTasks((prev) => [...prev, { ...task, id: Date.now(), done: false }]);
    },
    [setTasks]
  );

  const removeTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks]
  );

  const summary = {
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.actual, 0),
    totalExpense: transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.actual, 0),
    expectedExpense: transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.expected, 0),
    expectedIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.expected, 0),
  };
  summary.balance = summary.totalIncome - summary.totalExpense;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        tasks,
        addTransaction,
        removeTransaction,
        toggleTask,
        addTask,
        removeTask,
        summary,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
