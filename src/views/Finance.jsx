import { useContext, useState } from "react";
import { FinanceContext, CATEGORIES } from "../context/FinanceContext";

// Importações corretas de cada arquivo individual
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button"; 

import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Target,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";


const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: R${Number(p.value).toLocaleString("pt-BR")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_TOOLTIP = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const category = CATEGORIES.find(c => c.id === payload[0].name);
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm">
        <p style={{ color: category?.color || '#52525b' }} className="font-semibold">
          {category?.label || payload[0].name}
        </p>
        <p className="text-zinc-400 mt-1">
          R${Number(payload[0].value).toLocaleString("pt-BR")}
        </p>
      </div>
    );
  }
  return null;
};

export function FinanceView() {
  const { transactions, addTransaction, removeTransaction, summary } = useContext(FinanceContext);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", type: "expense", expected: "", actual: "", category: "essencial" });
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // "2026-03"

  // Função para mudar o mês
  const changeMonth = (offset) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  // Filtra as transações pelo mês atual
  const filteredTransactions = transactions.filter(t => (t.date || "").startsWith(currentMonth));

  const chartData = filteredTransactions.map(t => ({
    name: t.label.length > 8 ? t.label.slice(0, 8) + "…" : t.label,
    Esperado: t.expected,
    Real: t.actual,
    type: t.type,
  }));

  const pieData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const found = acc.find(item => item.name === t.category);
      if (found) { found.value += t.actual; }
      else { acc.push({ name: t.category, value: t.actual }); }
      return acc;
    }, []);

  // Recalcula o resumo apenas para o mês filtrado
  const monthlySummary = {
    income: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.actual, 0),
    expense: filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.actual, 0),
    expectedIncome: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.expected, 0),
    expectedExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.expected, 0),
  };
  monthlySummary.balance = monthlySummary.income - monthlySummary.expense;

  const handleAdd = () => {
    if (!form.label || !form.expected || !form.actual) return;
    addTransaction({
      label: form.label,
      type: form.type,
      category: form.category,
      expected: parseFloat(form.expected),
      actual: parseFloat(form.actual),
    });
    setForm({ label: "", type: "expense", expected: "", actual: "", category: "essencial" });
    setShowForm(false);
    // Volta para o mês atual depois de adicionar
    setCurrentMonth(new Date().toISOString().slice(0, 7));
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Meses */}
      <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-zinc-800 mb-4">
        <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft size={20} />
        </Button>
        
        <span className="text-sm font-bold text-white capitalize">
          {new Date(currentMonth + "-01").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        
        <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}>
          <ChevronRight size={20} />
        </Button>
      </div>

      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm">Visão geral</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">Finanças</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-500">Receitas</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">
            R${monthlySummary.income.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Esperado: R${monthlySummary.expectedIncome.toLocaleString("pt-BR")}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <span className="text-xs text-zinc-500">Despesas</span>
          </div>
          <p className="text-xl font-bold font-mono text-red-400">
            R${monthlySummary.expense.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Esperado: R${monthlySummary.expectedExpense.toLocaleString("pt-BR")}
          </p>
        </Card>
      </div>

      {/* Balance */}
      <Card className={`${monthlySummary.balance >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Saldo do mês</p>
            <p className={`text-3xl font-bold font-mono mt-1 ${monthlySummary.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {monthlySummary.balance >= 0 ? "+" : ""}R${monthlySummary.balance.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            monthlySummary.balance >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}>
            {monthlySummary.balance >= 0
              ? <TrendingUp size={24} className="text-emerald-400" />
              : <TrendingDown size={24} className="text-red-400" />
            }
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <Target size={14} className="text-amber-400" /> Expectativa vs. Realidade
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CUSTOM_TOOLTIP />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="Esperado" fill="#3f3f46" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Real" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.type === "income"
                      ? "#34d399"
                      : entry.Real > entry.Esperado
                      ? "#f87171"
                      : "#f59e0b"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          {[
            { color: "#3f3f46", label: "Esperado" },
            { color: "#f59e0b", label: "Real (ok)" },
            { color: "#f87171", label: "Acima" },
            { color: "#34d399", label: "Receita" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              <span className="text-[11px] text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Pie Chart - Distribuição de Gastos */}
      <Card className="mt-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Distribuição de Gastos</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORIES.find(c => c.id === entry.name)?.color || '#52525b'} />
              ))}
            </Pie>
            <Tooltip content={<PIE_TOOLTIP />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Lançamentos</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(v => !v)}>
                <Plus size={15} /> Novo
            </Button>
        </div>

        {showForm && (
          <Card className="mb-3 space-y-3">
            <input
              type="text"
              placeholder="Descrição (ex: Salário)"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
              <input
                type="number"
                placeholder="Esperado (R$)"
                value={form.expected}
                onChange={e => setForm(f => ({ ...f, expected: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <input
              type="number"
              placeholder="Valor real (R$)"
              value={form.actual}
              onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="flex-1">
    Salvar
  </Button>
  <Button 
    size="sm" 
    variant="ghost" 
    onClick={() => setShowForm(false)} 
    className="flex-1"
  >
    Cancelar
  </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                tx.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {tx.type === "income"
                  ? <TrendingUp size={16} className="text-emerald-400" />
                  : <TrendingDown size={16} className="text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{tx.label}</p>
                <p className="text-xs text-zinc-500">
                  Esperado: R${tx.expected.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold font-mono ${
                  tx.type === "income" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {tx.type === "income" ? "+" : "-"}R${tx.actual.toLocaleString("pt-BR")}
                </p>
                {tx.type === "expense" && tx.actual > tx.expected && (
                  <Badge variant="red">+R${(tx.actual - tx.expected).toLocaleString("pt-BR")}</Badge>
                )}
              </div>
              <button
                onClick={() => removeTransaction(tx.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors shrink-0 ml-1"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}