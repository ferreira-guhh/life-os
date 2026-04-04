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
  ChevronRight,
  LayoutDashboard,
  Wallet,
  Download
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

// Função para exportar dados como CSV
const exportToCSV = (data, fileName) => {
  if (data.length === 0) {
    alert("Nenhum dado para exportar!");
    return;
  }

  // 1. Definir o cabeçalho do CSV
  const headers = ["Data", "Descrição", "Tipo", "Categoria", "Esperado", "Real"];
  
  // 2. Mapear os dados para as colunas
  const rows = data.map(t => [
    t.date,
    t.label,
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.category,
    t.expected,
    t.actual
  ]);

  // 3. Juntar tudo com quebras de linha e vírgulas
  const csvContent = [
    headers.join(","), 
    ...rows.map(e => e.join(","))
  ].join("\n");

  // 4. Criar o arquivo e disparar o download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para exportar metas como CSV
const exportGoalsToCSV = (goals, fileName) => {
  if (goals.length === 0) {
    alert("Nenhuma meta para exportar!");
    return;
  }

  // 1. Definir o cabeçalho do CSV
  const headers = ["Nome", "Valor Alvo", "Valor Atual", "Progresso %", "Prazo"];
  
  // 2. Mapear os dados para as colunas
  const rows = goals.map(g => {
    const percent = Math.min(100, Math.round((g.current / g.target) * 100));
    return [
      g.name,
      g.target,
      g.current,
      percent,
      g.deadline
    ];
  });

  // 3. Juntar tudo com quebras de linha e vírgulas
  const csvContent = [
    headers.join(","), 
    ...rows.map(e => e.join(","))
  ].join("\n");

  // 4. Criar o arquivo e disparar o download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function FinanceView() {
  const { transactions, addTransaction, removeTransaction, goals, updateGoalProgress, addGoal, removeGoal } = useContext(FinanceContext);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, goals
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [form, setForm] = useState({ label: "", type: "expense", expected: "", actual: "", category: "essencial" });
  const [goalForm, setGoalForm] = useState({ name: "", target: "", deadline: "" });
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
    Esperado: Number(t.expected ?? 0),
    Real: Number(t.actual ?? 0),
    type: t.type,
  }));

  const pieData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const found = acc.find(item => item.name === t.category);
      if (found) { found.value += Number(t.actual ?? 0); }
      else { acc.push({ name: t.category, value: Number(t.actual ?? 0) }); }
      return acc;
    }, []);

  // Recalcula o resumo apenas para o mês filtrado
  const monthlySummary = {
    income: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.actual ?? 0), 0),
    expense: filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.actual ?? 0), 0),
    expectedIncome: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.expected ?? 0), 0),
    expectedExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.expected ?? 0), 0),
  };
  monthlySummary.balance = monthlySummary.income - monthlySummary.expense;

  const handleAdd = () => {
    const cleanLabel = form.label.trim();

    if (!cleanLabel || !form.actual) return;

    addTransaction({
      label: cleanLabel,
      type: form.type,
      category: form.category,
      expected: form.expected ? parseFloat(form.expected) : 0,
      actual: parseFloat(form.actual),
    });
    setForm({ label: "", type: "expense", expected: "", actual: "", category: "essencial" });
    setShowForm(false);
    // Volta para o mês atual depois de adicionar
    setCurrentMonth(new Date().toISOString().slice(0, 7));
  };

  const handleAddGoal = () => {
    if (!goalForm.name || !goalForm.target || !goalForm.deadline) return;
    addGoal({
      name: goalForm.name,
      target: parseFloat(goalForm.target),
      deadline: goalForm.deadline,
    });
    setGoalForm({ name: "", target: "", deadline: "" });
    setShowGoalForm(false);
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

      {/* Seletor de Abas */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-6">
        {[
          { id: 'overview', label: 'Resumo', icon: LayoutDashboard },
          { id: 'transactions', label: 'Extrato', icon: Wallet },
          { id: 'goals', label: 'Metas', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm">Visão geral</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">Finanças</h1>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="pb-20"> {/* Espaço extra para não cobrir a BottomNav */}
        
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Desempenho Mensal</h3>
            
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
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Histórico</h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportToCSV(filteredTransactions, `financeiro-${currentMonth}`)}
                  className="flex items-center gap-2"
                >
                  <Download size={14} /> Exportar CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
                  <Plus size={15} /> Novo
                </Button>
              </div>
            </div>

            {showForm && (
              <>
                {/* Backdrop: Escurece o fundo e fecha ao clicar fora */}
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                  onClick={() => setShowForm(false)}
                />

                {/* Drawer: A janela que desliza de baixo */}
                <div className="fixed bottom-0 left-0 right-0 z-[70] bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-w-lg mx-auto">
                  
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" /> {/* Alça visual do Drawer */}

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Novo Lançamento</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Fechar</Button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Descrição (ex: Lanche UNIP)"
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                      >
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                      </select>

                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Esperado (R$) opcional"
                        value={form.expected}
                        onChange={e => setForm(f => ({ ...f, expected: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                      />
                      <input
                        type="number"
                        placeholder="Real (R$) obrigatório"
                        value={form.actual}
                        onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                      />
                    </div>

                    <Button size="lg" onClick={handleAdd} className="mt-4 shadow-xl shadow-amber-500/10">
                      Confirmar Lançamento
                    </Button>
                  </div>
                </div>
              </>
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
                      Esperado: {tx.expected ? `R$${Number(tx.expected).toLocaleString("pt-BR")}` : "Não definido"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold font-mono ${
                      tx.type === "income" ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {tx.type === "income" ? "+" : "-"}R${Number(tx.actual ?? 0).toLocaleString("pt-BR")}
                    </p>
                    {tx.type === "expense" && Number(tx.actual ?? 0) > Number(tx.expected ?? 0) && (
                      <Badge variant="red">+R${(Number(tx.actual ?? 0) - Number(tx.expected ?? 0)).toLocaleString("pt-BR")}</Badge>
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
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Meus Objetivos</h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportGoalsToCSV(goals, `metas_${new Date().toISOString().split('T')[0]}`)}
                  className="flex items-center gap-2"
                >
                  <Download size={14} /> Exportar CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowGoalForm(v => !v)}>
                  <Plus size={15} /> Nova Meta
                </Button>
              </div>
            </div>

            {showGoalForm && (
              <>
                {/* Backdrop: Escurece o fundo e fecha ao clicar fora */}
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                  onClick={() => setShowGoalForm(false)}
                />

                {/* Drawer: A janela que desliza de baixo */}
                <div className="fixed bottom-0 left-0 right-0 z-[70] bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-w-lg mx-auto">
                  
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" /> {/* Alça visual do Drawer */}

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Nova Meta</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowGoalForm(false)}>Fechar</Button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nome da meta (ex: RTX 4060)"
                      value={goalForm.name}
                      onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                    />

                    <input
                      type="number"
                      placeholder="Valor alvo (R$)"
                      value={goalForm.target}
                      onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                    />

                    <input
                      type="month"
                      value={goalForm.deadline}
                      onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-4 text-sm outline-none focus:border-amber-500"
                    />

                    <Button size="lg" onClick={handleAddGoal} className="mt-4 shadow-xl shadow-amber-500/10">
                      Confirmar Meta
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              {goals.map(goal => {
                const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                  <Card key={goal.id} className="border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-white">{goal.name}</p>
                        <p className="text-xs text-zinc-500">Alvo: R${goal.target.toLocaleString()}</p>
                      </div>
                      <span className="text-amber-400 font-mono text-sm">{percent}%</span>
                    </div>
                    
                    {/* Barra de Progresso */}
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-1000" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-[10px] text-zinc-600">Faltam: R${(goal.target - goal.current).toLocaleString()}</p>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px]"
                          onClick={() => updateGoalProgress(goal.id, 100)}
                        >
                          + R$100
                        </Button>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-zinc-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
