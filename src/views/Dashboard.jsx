import { useContext, useEffect, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock, Gift } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { FinanceContext } from "../context/FinanceContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export function DashboardView({ user }) {
  const {
    dateStr,
    setView,
    currentLevel,
    xpProgress,
    nextLevelXp,
    xpProgressPercent,
    rewardTaskCompletion,
    rollbackTaskCompletion,
    boxesCount,
    boxProgress,
    taskProgressTarget,
    isTaskEligibleForRewards,
  } = useContext(AppContext);
  const { tasks, toggleTask, setTaskRewardMeta, addTask, removeTask, summary } =
    useContext(FinanceContext);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState("09:00");
  const [newLabel, setNewLabel] = useState("");
  const [rewardBursts, setRewardBursts] = useState([]);
  const burstIdRef = useRef(0);
  const burstTimeoutsRef = useRef(new Map());

  useEffect(() => {
    const timeouts = burstTimeoutsRef.current;

    return () => {
      timeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeouts.clear();
    };
  }, []);

  const emitRewardBurst = (payload) => {
    burstIdRef.current += 1;
    const id = burstIdRef.current;

    setRewardBursts((previous) => [...previous, { id, ...payload }]);

    const timeoutId = window.setTimeout(() => {
      setRewardBursts((previous) =>
        previous.filter((entry) => entry.id !== id)
      );
      burstTimeoutsRef.current.delete(id);
    }, 950);

    burstTimeoutsRef.current.set(id, timeoutId);
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Dev";

  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const handleAdd = () => {
    const cleanLabel = newLabel.replace(/\s+/g, " ").trim();

    if (!cleanLabel) {
      return;
    }

    addTask({ time: newTime, label: cleanLabel });
    setNewLabel("");
    setShowAdd(false);
  };

  const handleToggleTask = async (taskId) => {
    const task = tasks.find((entry) => entry.id === taskId);

    if (!task) {
      return;
    }

    const nextDone = !task.done;

    toggleTask(taskId);

    if (nextDone) {
      const reward = await rewardTaskCompletion(task);

      if (reward?.error) {
        toggleTask(taskId);
        emitRewardBurst({
          tone: "neutral",
          label: "Sync falhou",
          detail: "Nao foi possivel salvar no Supabase.",
        });
        return;
      }

      if (reward?.skipped) {
        setTaskRewardMeta(taskId, null);
        emitRewardBurst({
          tone: "neutral",
          label: "Sem XP",
          detail: "Task vazia nao pontua.",
        });
        return;
      }

      if (reward?.rewardMeta) {
        setTaskRewardMeta(taskId, reward.rewardMeta);
      }

      emitRewardBurst({
        tone: "up",
        xp: reward?.xp ?? 0,
        gold: reward?.gold ?? 0,
      });
      return;
    }

    const rewardMeta = task.reward_meta;

    if (!rewardMeta) {
      return;
    }

    const rollback = await rollbackTaskCompletion(rewardMeta);

    if (!rollback?.success) {
      toggleTask(taskId);
      emitRewardBurst({
        tone: "neutral",
        label: "Rollback falhou",
        detail: "O estado anterior nao voltou do banco.",
      });
      return;
    }

    setTaskRewardMeta(taskId, null);

    if (!rollback.skipped) {
      emitRewardBurst({
        tone: "down",
        xp: rollback.xp ?? 0,
        gold: rollback.gold ?? 0,
      });
    }
  };

  const handleRemoveTask = async (task) => {
    if (task.done && task.reward_meta) {
      const rollback = await rollbackTaskCompletion(task.reward_meta);

      if (!rollback?.success) {
        emitRewardBurst({
          tone: "neutral",
          label: "Nao removeu",
          detail: "Falha ao reverter a recompensa no banco.",
        });
        return;
      }

      if (!rollback.skipped) {
        emitRewardBurst({
          tone: "down",
          xp: rollback.xp ?? 0,
          gold: rollback.gold ?? 0,
        });
      }
    }

    removeTask(task.id);
  };

  const sortedTasks = [...tasks].sort((left, right) =>
    left.time.localeCompare(right.time)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-24">
      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm capitalize">{dateStr}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          Tarefas e Rotina, {displayName}
        </h1>
      </div>

      <Card className="relative flex items-center gap-4 overflow-hidden border-amber-500/30">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#27272a"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeDasharray="175"
              strokeDashoffset={175 - xpProgressPercent * 1.75}
              className="transition-all duration-300"
            />
          </svg>
          <span className="text-xl font-bold text-white">Lvl {currentLevel}</span>
        </div>

        <div className="relative flex-1">
          <p className="text-xs font-bold uppercase text-zinc-500">
            Patente Atual
          </p>
          <p className="text-sm font-mono text-amber-400">
            {xpProgress} / {nextLevelXp} XP
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            XP e gold sobem ou descem no mesmo clique, sem delay.
          </p>

          <div className="pointer-events-none absolute right-0 top-0 flex flex-col items-end gap-2">
            {rewardBursts.map((burst) => {
              const classes = {
                up: "xp-float-up border-amber-400/35 bg-amber-500/15 text-amber-100 shadow-[0_0_28px_rgba(245,158,11,0.2)]",
                down:
                  "xp-float-down border-rose-400/30 bg-rose-500/10 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.18)]",
                neutral:
                  "xp-float-neutral border-zinc-700 bg-zinc-900/95 text-zinc-200 shadow-[0_0_18px_rgba(24,24,27,0.45)]",
              };

              return (
                <div
                  key={burst.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-xl ${classes[burst.tone]}`}
                >
                  {burst.tone === "neutral" ? (
                    <span>{burst.label}</span>
                  ) : (
                    <span>
                      {burst.tone === "up" ? "+" : "-"}
                      {burst.xp} XP • {burst.tone === "up" ? "+" : "-"}
                      {burst.gold} Gold
                    </span>
                  )}
                  {burst.detail ? (
                    <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {burst.detail}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="text-center">
          <p className="mb-1 text-[11px] text-zinc-500">Progresso</p>
          <p className="font-mono text-xl font-bold text-amber-400">
            {progress}%
          </p>
        </Card>
        <Card className="text-center">
          <p className="mb-1 text-[11px] text-zinc-500">Tarefas</p>
          <p className="font-mono text-xl font-bold text-white">
            {completed}/{tasks.length}
          </p>
        </Card>
        <Card className="text-center" onClick={() => setView("finance")}>
          <p className="mb-1 text-[11px] text-zinc-500">Saldo</p>
          <p
            className={`font-mono text-xl font-bold ${
              summary.balance >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {summary.balance >= 0 ? "+" : ""}R$
            {Math.abs(summary.balance).toLocaleString("pt-BR")}
          </p>
        </Card>
        <Card
          className="text-center border-amber-500/20"
          onClick={() => setView("store")}
        >
          <p className="mb-1 text-[11px] text-zinc-500">Boxes</p>
          <p className="flex items-center justify-center gap-1 font-mono text-xl font-bold text-amber-300">
            <Gift size={16} /> {boxesCount}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {boxProgress}/{taskProgressTarget}
          </p>
        </Card>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Clock size={16} className="text-amber-400" /> Plano do Dia
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdd((value) => !value)}
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
                onChange={(event) => setNewTime(event.target.value)}
                className="w-28 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newLabel}
                placeholder="Titulo do bloco..."
                onChange={(event) => setNewLabel(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleAdd()}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Qualquer tarefa com texto conta XP e progresso para a loot box.
            </p>
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
          {sortedTasks.map((task) => {
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                  task.done
                    ? "border-zinc-800/50 bg-zinc-900/50 opacity-60"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <button
                  onClick={() => void handleToggleTask(task.id)}
                  className="shrink-0 text-zinc-500 transition-colors hover:text-amber-400"
                >
                  {task.done ? (
                    <CheckCircle2 size={22} className="text-amber-400" />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>
                <span className="w-12 shrink-0 font-mono text-xs text-amber-400/80">
                  {task.time}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <span
                    className={`text-sm ${
                      task.done ? "text-zinc-600 line-through" : "text-zinc-200"
                    }`}
                  >
                    {task.label}
                  </span>
                  {!isTaskEligibleForRewards(task) && (
                    <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Sem XP
                    </span>
                  )}
                </div>
                <button
                  onClick={() => void handleRemoveTask(task)}
                  className="shrink-0 text-zinc-700 transition-colors hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="py-8 text-center text-sm text-zinc-600">
              Nenhuma tarefa. Adicione seu plano do dia!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
