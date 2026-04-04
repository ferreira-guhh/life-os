import { useContext, useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Wallet,
  Gift,
  ScrollText,
  Timer,
  Package,
  ChevronRight,
  Flame,
  Trophy,
  Coins,
  Boxes,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { FinanceContext } from "../context/FinanceContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { InventoryDrawer } from "../components/InventoryDrawer";
import { useLocalStorage } from "../hooks/useLocalStorage";

const HUB_CARD_STYLES = {
  tasks: {
    border: "border-amber-500/30",
    iconWrap: "border-amber-500/30 bg-amber-500/12 text-amber-200",
    glow: "hover:shadow-[0_0_36px_rgba(245,158,11,0.18)] hover:border-amber-500/60",
  },
  finance: {
    border: "border-emerald-500/25",
    iconWrap: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
    glow: "hover:shadow-[0_0_36px_rgba(245,158,11,0.18)] hover:border-amber-500/60",
  },
  store: {
    border: "border-violet-500/25",
    iconWrap: "border-violet-500/30 bg-violet-500/12 text-violet-200",
    glow: "hover:shadow-[0_0_36px_rgba(245,158,11,0.18)] hover:border-amber-500/60",
  },
  missions: {
    border: "border-sky-500/25",
    iconWrap: "border-sky-500/30 bg-sky-500/12 text-sky-200",
    glow: "hover:shadow-[0_0_36px_rgba(245,158,11,0.18)] hover:border-amber-500/60",
  },
  focus: {
    border: "border-orange-500/25",
    iconWrap: "border-orange-500/30 bg-orange-500/12 text-orange-200",
    glow: "hover:shadow-[0_0_36px_rgba(245,158,11,0.18)] hover:border-amber-500/60",
  },
};

export function HomeHubView({ user }) {
  const {
    setView,
    profile,
    currentLevel,
    xpProgress,
    nextLevelXp,
    xpProgressPercent,
    totalGold,
    boxesCount,
    socialCouponCount,
    passFreeCount,
    xpBoostCount,
    inventoryCountByKey,
    activeSocialCouponExpiresAt,
    hasActiveSocialCoupon,
    hasActiveXpMultiplier,
    activeDailyQuests,
    dailyQuestBoard,
  } = useContext(AppContext);
  const { tasks, summary, transactions } = useContext(FinanceContext);
  const [focusSessions] = useLocalStorage("lifeos_sessions", 0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Dev";

  const streak = profile?.streak ?? 0;
  const streakPercent = Math.min(100, Math.round((streak / 7) * 100));
  const pendingTasks = tasks.filter((task) => !task.done).length;
  const completedQuests = dailyQuestBoard.filter((quest) => quest.isCompleted).length;
  const lastExpense = transactions.find(
    (transaction) => transaction.type === "expense"
  );
  const balanceColor = summary.balance >= 0 ? "text-emerald-300" : "text-rose-300";
  const inventoryTotalCount = useMemo(
    () =>
      Object.values(inventoryCountByKey ?? {}).reduce(
        (sum, quantity) => sum + (Number(quantity) || 0),
        0
      ),
    [inventoryCountByKey]
  );
  const socialCouponRemainingMs =
    hasActiveSocialCoupon && activeSocialCouponExpiresAt
      ? Math.max(0, new Date(activeSocialCouponExpiresAt).getTime() - now)
      : 0;
  const xpBoostRemainingMs =
    hasActiveXpMultiplier && profile?.xp_multiplier_expires_at
      ? Math.max(0, new Date(profile.xp_multiplier_expires_at).getTime() - now)
      : 0;

  useEffect(() => {
    if (!hasActiveSocialCoupon && !hasActiveXpMultiplier) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveSocialCoupon, hasActiveXpMultiplier]);

  const formatCountdown = (remainingMs) => {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const activeEffects = [
    hasActiveSocialCoupon
      ? {
          id: "social",
          label: "Cupom Social",
          value: formatCountdown(socialCouponRemainingMs),
          Icon: Ticket,
          className: "border-sky-500/25 bg-sky-500/10 text-sky-100",
        }
      : null,
    hasActiveXpMultiplier
      ? {
          id: "boost",
          label: "XP Boost 1.5x",
          value: formatCountdown(xpBoostRemainingMs),
          Icon: Zap,
          className: "border-violet-500/25 bg-violet-500/10 text-violet-100",
        }
      : null,
  ].filter(Boolean);

  const hubCards = [
    {
      id: "tasks",
      label: "Tarefas",
      title: "Plano do Dia",
      description: "Abra sua rotina, marque progresso e mantenha o ritmo.",
      detail: `${pendingTasks} tarefas pendentes`,
      badge: `${pendingTasks} abertas`,
      Icon: CheckSquare,
      style: HUB_CARD_STYLES.tasks,
    },
    {
      id: "finance",
      label: "Financas",
      title: `Saldo ${summary.balance >= 0 ? "positivo" : "em alerta"}`,
      description: lastExpense
        ? `Ultimo gasto: ${lastExpense.label} | R$${Number(lastExpense.actual).toLocaleString("pt-BR")}`
        : "Nenhuma despesa recente registrada.",
      detail: `${summary.balance >= 0 ? "+" : "-"}R$${Math.abs(summary.balance).toLocaleString("pt-BR")}`,
      badge: "caixa do dia",
      Icon: Wallet,
      style: HUB_CARD_STYLES.finance,
    },
    {
      id: "store",
      label: "Loja & Loot Box",
      title: `${totalGold} gold no inventario`,
      description: `${boxesCount} caixas prontas para abrir na arena.`,
      detail: `${boxesCount} boxes disponiveis`,
      badge: "drops e boosts",
      Icon: Gift,
      style: HUB_CARD_STYLES.store,
    },
    {
      id: "missions",
      label: "Quadro de Missoes",
      title: `${activeDailyQuests.length} missoes ativas`,
      description: `${completedQuests} concluidas hoje no bounty board.`,
      detail: `${dailyQuestBoard.length} quests geradas`,
      badge: "daily quests",
      Icon: ScrollText,
      style: HUB_CARD_STYLES.missions,
    },
    {
      id: "focus",
      label: "Foco Pomodoro",
      title: `${focusSessions} pomodoros hoje`,
      description: "Entre direto no timer e empilhe sessoes de concentracao.",
      detail: "atalho rapido para foco",
      badge: "timer live",
      Icon: Timer,
      style: HUB_CARD_STYLES.focus,
    },
  ];

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-5 shadow-[0_0_80px_rgba(245,158,11,0.08)] sm:p-6">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/75">
              LifeOS Launcher
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Hub Central de {displayName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
              Seu launcher agora concentra rotas, status de progresso e atalhos de jogo em um unico ponto de entrada.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                onClick={() => setIsInventoryOpen(true)}
                className="w-full sm:w-auto"
              >
                <Package size={16} />
                Abrir Mochila
              </Button>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                  {inventoryTotalCount} itens prontos
                </span>
                <span className="rounded-full border border-zinc-800 bg-zinc-950/75 px-3 py-1.5 text-xs text-zinc-300">
                  {socialCouponCount} cupons
                </span>
                <span className="rounded-full border border-zinc-800 bg-zinc-950/75 px-3 py-1.5 text-xs text-zinc-300">
                  {xpBoostCount} boosts
                </span>
                <span className="rounded-full border border-zinc-800 bg-zinc-950/75 px-3 py-1.5 text-xs text-zinc-300">
                  {passFreeCount} passes
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Trophy size={15} className="text-amber-300" />
                Nivel atual
              </div>
              <p className="mt-2 text-xl font-bold text-white">Lvl {currentLevel}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Flame size={15} className="text-amber-300" />
                Streak
              </div>
              <p className="mt-2 text-xl font-bold text-white">{streak} dias</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Coins size={15} className="text-amber-300" />
                Gold
              </div>
              <p className="mt-2 text-xl font-bold text-white">{totalGold}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Boxes size={15} className="text-amber-300" />
                Loot Boxes
              </div>
              <p className="mt-2 text-xl font-bold text-white">{boxesCount}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/65 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              <span>Barra de XP</span>
              <span className="text-amber-200">
                {xpProgress}/{nextLevelXp}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 transition-all duration-300"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/65 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              <span>Barra de Streak</span>
              <span className="text-amber-200">{streak}/7</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-200 transition-all duration-300"
                style={{ width: `${streakPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/65 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Efeitos ativos
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Cupons e boosts consumidos na mochila aparecem aqui com o tempo real de duracao.
                </p>
              </div>
              {activeEffects.length === 0 ? (
                <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-400">
                  Nenhum efeito ativo
                </span>
              ) : null}
            </div>

            {activeEffects.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {activeEffects.map((effect) => (
                  <div
                    key={effect.id}
                    className={`rounded-2xl border px-4 py-3 ${effect.className}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">
                          {effect.label}
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">
                          {effect.value}
                        </p>
                      </div>
                      <effect.Icon size={18} className="shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/65 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Estoque rapido
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Mochila sincronizada com a arena e pronta para ativacao manual.
                </p>
              </div>
              <ShieldCheck size={18} className="text-amber-300" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Ticket size={15} className="text-sky-200" />
                  <span className="text-xs text-sky-100">Cupom</span>
                </div>
                <p className="mt-3 text-xl font-bold text-white">x{socialCouponCount}</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Zap size={15} className="text-violet-200" />
                  <span className="text-xs text-violet-100">Boost</span>
                </div>
                <p className="mt-3 text-xl font-bold text-white">x{xpBoostCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <ShieldCheck size={15} className="text-amber-100" />
                  <span className="text-xs text-amber-100">Passe</span>
                </div>
                <p className="mt-3 text-xl font-bold text-white">x{passFreeCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {hubCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setView(card.id)}
            className={`group rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 text-left transition-all duration-300 ${card.style.border} ${card.style.glow}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${card.style.iconWrap}`}
              >
                <card.Icon size={20} />
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                {card.badge}
              </span>
            </div>

            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              {card.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{card.title}</p>
            <p className="mt-2 min-h-[56px] text-sm leading-6 text-zinc-400">
              {card.description}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                className={`text-sm font-semibold ${
                  card.id === "finance" ? balanceColor : "text-amber-200"
                }`}
              >
                {card.detail}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition-all group-hover:border-amber-500/40 group-hover:text-amber-200">
                <ChevronRight size={18} />
              </div>
            </div>
          </button>
        ))}
      </section>

      <Card className="border-dashed border-amber-500/25 bg-zinc-950/80 text-center">
        <p className="text-xs leading-7 text-zinc-500">
          <span className="font-semibold text-amber-300">Codigo de Honra:</span>{" "}
          cada task tem identidade unica, cada recompensa conta uma vez e o progresso so vale quando nasce de execucao real.
        </p>
      </Card>
      </div>

      {isInventoryOpen ? (
        <InventoryDrawer
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
        />
      ) : null}
    </>
  );
}

export default HomeHubView;
