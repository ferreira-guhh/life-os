import { useContext, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { FinanceContext } from "../context/FinanceContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export function DashboardView() {
  const { 
    dateStr, 
    setView, 
    currentLevel, 
    xpProgress, 
    nextLevelXp, 
    xpProgressPercent,
    executeReward 
  } = useContext(AppContext);
  const { tasks, toggleTask, addTask, removeTask, summary } =
    useContext(FinanceContext);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState("09:00");
  const [newLabel, setNewLabel] = useState("");

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addTask({ time: newTime, label: newLabel.trim() });
    setNewLabel("");
    setShowAdd(false);
  };

  // Integração: Tarefa ➔ XP ➔ Ouro
  const handleToggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const isCompleting = !task.done; // true = marcando como feito

    // Toggle a tarefa
    toggleTask(taskId);

    // Se está marcando como feito, ganha XP
    if (isCompleting) {
      const reward = executeReward('SIMPLE_TASK');
      if (reward) {
        console.log(`✅ Tarefa: "${task.label}" | ${reward.message}`);
      }
    }
  };

  const sortedTasks = [...tasks].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm capitalize">{dateStr}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          Bom dia, Dev <span className="wave">👋</span>
        </h1>
      </div>

      {/* Level Widget */}
      <Card className="flex items-center gap-4 border-amber-500/30">
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="absolute w-full h-full -rotate-90">
            {/* Fundo do círculo */}
            <circle cx="32" cy="32" r="28" fill="none" stroke="#27272a" strokeWidth="4" />
            {/* Progresso (amarelo) */}
            <circle 
              cx="32" 
              cy="32" 
              r="28" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="4"
              strokeDasharray="175" 
              strokeDashoffset={175 - (xpProgressPercent * 1.75)}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="text-xl font-bold text-white">Lvl {currentLevel}</span>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold">Patente Atual</p>
          <p className="text-sm text-amber-400 font-mono">{xpProgress} / {nextLevelXp} XP</p>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-[11px] text-zinc-500 mb-1">Progresso</p>
          <p className="text-xl font-bold text-amber-400 font-mono">
            {progress}%
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] text-zinc-500 mb-1">Tarefas</p>
          <p className="text-xl font-bold text-white font-mono">
            {completed}/{tasks.length}
          </p>
        </Card>
        <Card className="text-center" onClick={() => setView("finance")}>
          <p className="text-[11px] text-zinc-500 mb-1">Saldo</p>
          <p
            className={`text-xl font-bold font-mono ${
              summary.balance >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {summary.balance >= 0 ? "+" : ""}R$
            {Math.abs(summary.balance).toLocaleString("pt-BR")}
          </p>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Daily Planner */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock size={16} className="text-amber-400" /> Plano do Dia
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus size={15} /> Adicionar
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-3 space-y-3">
            <div className="flex gap-3">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono w-28 outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newLabel}
                placeholder="Título do bloco..."
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="flex-1">
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdd(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                task.done
                  ? "bg-zinc-900/50 border-zinc-800/50 opacity-60"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <button
                onClick={() => handleToggleTask(task.id)}
                className="text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
              >
                {task.done ? (
                  <CheckCircle2 size={22} className="text-amber-400" />
                ) : (
                  <Circle size={22} />
                )}
              </button>
              <span className="font-mono text-xs text-amber-400/80 shrink-0 w-12">
                {task.time}
              </span>
              <span
                className={`flex-1 text-sm ${
                  task.done
                    ? "line-through text-zinc-600"
                    : "text-zinc-200"
                }`}
              >
                {task.label}
              </span>
              <button
                onClick={() => removeTask(task.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-sm">
              Nenhuma tarefa. Adicione seu plano do dia!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}