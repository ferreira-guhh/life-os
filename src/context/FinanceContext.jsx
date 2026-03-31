import { createContext, useCallback, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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

const DEFAULT_GOALS = [
  { id: 1, name: "RTX 4060", target: 2000, current: 0, deadline: "2026-06" },
  { id: 2, name: "Ryzen 5 5600X", target: 1200, current: 0, deadline: "2026-05" }
];

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Buscar transações ao carregar
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (!error && data) {
        setTransactions(data);
      } else {
        // Fallback para dados padrão se houver erro
        setTransactions(DEFAULT_TRANSACTIONS);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  // 2. Buscar metas ao carregar
  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('deadline', { ascending: true });
      
      if (!error && data) {
        setGoals(data);
      } else {
        setGoals(DEFAULT_GOALS);
      }
    };
    fetchGoals();
  }, []);

  // 3. Adicionar transação no banco
  const addTransaction = useCallback(async (tx) => {
    const newTx = {
      ...tx,
      date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newTx])
      .select();

    if (!error && data) {
      setTransactions(prev => [data[0], ...prev]);
    }
  }, []);

  // 4. Remover transação do banco
  const removeTransaction = useCallback(async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  // 5. Adicionar meta no banco
  const addGoal = useCallback(async (goal) => {
    const newGoal = {
      ...goal,
      current: 0
    };

    const { data, error } = await supabase
      .from('goals')
      .insert([newGoal])
      .select();

    if (!error && data) {
      setGoals(prev => [...prev, data[0]]);
    }
  }, []);

  // 6. Remover meta do banco
  const removeGoal = useCallback(async (id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  }, []);

  // 7. Atualizar progresso da meta no banco
  const updateGoalProgress = useCallback(async (id, amount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newCurrent = Math.max(0, goal.current + amount);

    const { error } = await supabase
      .from('goals')
      .update({ current: newCurrent })
      .eq('id', id);

    if (!error) {
      setGoals(prev => prev.map(g =>
        g.id === id ? { ...g, current: newCurrent } : g
      ));
    }
  }, [goals]);

  // 8. Toggle task (local apenas)
  const toggleTask = useCallback((id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  // 9. Adicionar task (local apenas)
  const addTask = useCallback((task) => {
    setTasks(prev => [...prev, { ...task, id: Date.now(), done: false }]);
  }, []);

  // 10. Remover task (local apenas)
  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

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
        goals,
        addTransaction,
        removeTransaction,
        toggleTask,
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
