/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const FinanceContext = createContext(null);

export const CATEGORIES = [
  { id: "essencial", label: "Essencial", color: "#818cf8" },
  { id: "educacao", label: "Educacao", color: "#fbbf24" },
  { id: "lazer", label: "Lazer", color: "#f472b6" },
  { id: "saude", label: "Saude", color: "#34d399" },
  { id: "investimento", label: "Investimento", color: "#a78bfa" },
  { id: "outros", label: "Outros", color: "#94a3b8" },
];

const DEFAULT_TASKS = [
  {
    id: 1,
    time: "06:00",
    label: "Acordar & Exercitar",
    done: false,
    reward_meta: null,
  },
  {
    id: 2,
    time: "08:00",
    label: "Estudar / Deep Work",
    done: false,
    reward_meta: null,
  },
  {
    id: 3,
    time: "12:00",
    label: "Almoco & Pausa",
    done: false,
    reward_meta: null,
  },
  {
    id: 4,
    time: "14:00",
    label: "Reunioes / Tarefas",
    done: false,
    reward_meta: null,
  },
  {
    id: 5,
    time: "18:00",
    label: "Review do dia",
    done: false,
    reward_meta: null,
  },
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 1,
    label: "Salario",
    type: "income",
    category: "outros",
    expected: 5000,
    actual: 5000,
    date: "2026-03-30",
  },
  {
    id: 2,
    label: "Aluguel",
    type: "expense",
    category: "essencial",
    expected: 1500,
    actual: 1500,
    date: "2026-03-01",
  },
  {
    id: 3,
    label: "Alimentacao",
    type: "expense",
    category: "essencial",
    expected: 800,
    actual: 950,
    date: "2026-03-28",
  },
  {
    id: 4,
    label: "Transporte",
    type: "expense",
    category: "essencial",
    expected: 300,
    actual: 280,
    date: "2026-03-29",
  },
];

const DEFAULT_GOALS = [
  { id: 1, name: "RTX 4060", target: 2000, current: 0, deadline: "2026-06" },
  {
    id: 2,
    name: "Ryzen 5 5600X",
    target: 1200,
    current: 0,
    deadline: "2026-05",
  },
];

const createTaskId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        setTransactions(data);
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
      }
    };

    void fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("deadline", { ascending: true });

      if (!error && data) {
        setGoals(data);
      } else {
        setGoals(DEFAULT_GOALS);
      }
    };

    void fetchGoals();
  }, []);

  const addTransaction = useCallback(async (tx) => {
    const newTx = {
      ...tx,
      expected: Number(tx.expected ?? 0),
      actual: Number(tx.actual ?? 0),
      date: new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([newTx])
      .select();

    if (!error && data) {
      setTransactions((previous) => [data[0], ...previous]);
    }
  }, []);

  const removeTransaction = useCallback(async (id) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (!error) {
      setTransactions((previous) =>
        previous.filter((transaction) => transaction.id !== id)
      );
    }
  }, []);

  const addGoal = useCallback(async (goal) => {
    const newGoal = {
      ...goal,
      current: 0,
    };

    const { data, error } = await supabase.from("goals").insert([newGoal]).select();

    if (!error && data) {
      setGoals((previous) => [...previous, data[0]]);
    }
  }, []);

  const removeGoal = useCallback(async (id) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (!error) {
      setGoals((previous) => previous.filter((goal) => goal.id !== id));
    }
  }, []);

  const updateGoalProgress = useCallback(
    async (id, amount) => {
      const goal = goals.find((entry) => entry.id === id);

      if (!goal) {
        return;
      }

      const newCurrent = Math.max(0, goal.current + amount);

      const { error } = await supabase
        .from("goals")
        .update({ current: newCurrent })
        .eq("id", id);

      if (!error) {
        setGoals((previous) =>
          previous.map((entry) =>
            entry.id === id ? { ...entry, current: newCurrent } : entry
          )
        );
      }
    },
    [goals]
  );

  const toggleTask = useCallback((id) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }, []);

  const setTaskRewardMeta = useCallback((id, rewardMeta) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, reward_meta: rewardMeta } : task
      )
    );
  }, []);

  const addTask = useCallback((task) => {
    setTasks((previous) => [
      ...previous,
      {
        ...task,
        id: createTaskId(),
        done: false,
        reward_meta: null,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }, []);

  const summary = {
    totalIncome: transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.actual, 0),
    totalExpense: transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.actual, 0),
    expectedExpense: transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.expected, 0),
    expectedIncome: transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.expected, 0),
  };

  summary.balance = summary.totalIncome - summary.totalExpense;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        tasks,
        goals,
        addTransaction,
        removeTransaction,
        toggleTask,
        setTaskRewardMeta,
        addTask,
        removeTask,
        updateGoalProgress,
        addGoal,
        removeGoal,
        summary,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
