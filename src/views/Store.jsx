import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Crown,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Zap,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { BOX_RARITY_META } from "../lib/mysteryBox";
import { MysteryBoxModal } from "../components/MysteryBoxModal";
import { LootBoxWidget } from "../components/LootBoxWidget";
import Card from "../components/Card";
import Button from "../components/Button";

const REWARDS_CATALOG = [
  {
    id: 1,
    name: "30 min Redes Sociais",
    description: "Instagram, TikTok ou YouTube",
    cost: 50,
    tier: "fast",
    minLvl: 1,
    icon: Zap,
  },
  {
    id: 2,
    name: "1 Episodio de Serie",
    description: "Seu anime ou serie favorita",
    cost: 50,
    tier: "fast",
    minLvl: 1,
    icon: Zap,
  },
  {
    id: 3,
    name: "30 min Gaming",
    description: "Jogar seu titulo favorito",
    cost: 75,
    tier: "fast",
    minLvl: 2,
    icon: Zap,
  },
  {
    id: 4,
    name: "Pedir um Lanche",
    description: "Pizza, hamburguer ou comida favorita",
    cost: 300,
    tier: "medium",
    minLvl: 5,
    icon: Target,
  },
  {
    id: 5,
    name: "2h Maratona",
    description: "Tempo liberado no seu hobby",
    cost: 350,
    tier: "medium",
    minLvl: 5,
    icon: Target,
  },
  {
    id: 6,
    name: "Ir ao Cinema",
    description: "Filme da sua escolha",
    cost: 400,
    tier: "medium",
    minLvl: 6,
    icon: Target,
  },
  {
    id: 7,
    name: "Novo Mouse ou Teclado",
    description: "Upgrade no setup",
    cost: 1500,
    tier: "epic",
    minLvl: 10,
    icon: Crown,
  },
  {
    id: 8,
    name: "Dia Livre",
    description: "Um dia sem estudar e sem culpa",
    cost: 1200,
    tier: "epic",
    minLvl: 10,
    icon: Crown,
  },
  {
    id: 9,
    name: "Monitoria Desbloqueada",
    description: "Ajuda premium para os projetos",
    cost: 2000,
    tier: "epic",
    minLvl: 12,
    icon: Crown,
  },
];

const TIER_COLORS = {
  fast: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400",
    label: "Rapida",
  },
  medium: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    badge: "bg-violet-500/20 text-violet-400",
    label: "Media",
  },
  epic: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400",
    label: "Epica",
  },
};

export function StoreView() {
  const {
    totalGold,
    spendGold,
    currentLevel,
    boxesCount,
    boxProgress,
    taskProgressTarget,
    socialCouponCount,
    passFreeCount,
    xpBoostCount,
    hasActiveSocialCoupon,
    socialCouponRemainingMinutes,
    hasActiveXpMultiplier,
    xpMultiplierRemainingMinutes,
    openMysteryBox,
    isOpeningBox,
    triggerMysteryBoxToast,
  } = useContext(AppContext);
  const [purchasedItems, setPurchasedItems] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const notificationTimeoutRef = useRef(null);
  const boxFlowLockRef = useRef(false);

  const clearNotificationTimeout = useCallback(() => {
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearNotificationTimeout();
      boxFlowLockRef.current = false;
    },
    [clearNotificationTimeout]
  );

  const setTimedNotification = useCallback((nextNotification, duration = 3600) => {
    setNotification(nextNotification);
    clearNotificationTimeout();

    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, duration);
  }, [clearNotificationTimeout]);

  const handleCloseBox = useCallback(() => {
    if (isOpening) {
      return;
    }

    boxFlowLockRef.current = false;
    setShowResult(false);
    setIsOpening(false);
    setResult(null);
    setIsBoxModalOpen(false);
  }, [isOpening]);

  const handleBoxSpinComplete = useCallback(() => {
    if (!result) {
      boxFlowLockRef.current = false;
      setIsOpening(false);
      setShowResult(false);
      return;
    }

    setIsOpening(false);
    setShowResult(true);
    boxFlowLockRef.current = false;

    triggerMysteryBoxToast(result);
    setTimedNotification(
      {
        type: result.rarity,
        message: `Drop confirmado: ${result.title}.`,
      },
      4200
    );
  }, [result, setTimedNotification, triggerMysteryBoxToast]);

  const handleOpenBox = useCallback(async () => {
    if (boxFlowLockRef.current || isOpening || isOpeningBox) {
      return;
    }

    boxFlowLockRef.current = true;
    setShowResult(false);
    setResult(null);
    setIsBoxModalOpen(false);
    setIsOpening(true);

    const openResult = await openMysteryBox();

    if (openResult.error || !openResult.reward) {
      boxFlowLockRef.current = false;
      setIsOpening(false);
      setShowResult(false);
      setResult(null);
      setIsBoxModalOpen(false);
      setTimedNotification(
        {
          type: "error",
          message: openResult.error?.message || "Erro ao abrir a caixa.",
        },
        4000
      );
      return;
    }

    setResult(openResult.reward);
    setIsBoxModalOpen(true);
  }, [isOpening, isOpeningBox, openMysteryBox, setTimedNotification]);

  const handlePurchase = async (reward) => {
    const isLocked = currentLevel < reward.minLvl;
    const canAfford = totalGold >= reward.cost;

    if (isLocked) {
      setTimedNotification(
        {
          type: "locked",
          message: `Esse mimo abre no nivel ${reward.minLvl}.`,
        },
        3200
      );
      return;
    }

    if (!canAfford) {
      setTimedNotification(
        {
          type: "error",
          message: `Voce precisa de mais ${reward.cost - totalGold} gold.`,
        },
        3200
      );
      return;
    }

    const result = await spendGold(reward.cost);

    if (result.success) {
      setPurchasedItems((previous) => new Set([...previous, reward.id]));
      setTimedNotification(
        {
          type: "success",
          message: `${reward.name} resgatado com sucesso.`,
        },
        3800
      );
      return;
    }

    setTimedNotification(
      {
        type: "error",
        message: result.message || "Erro ao processar compra.",
      },
      3800
    );
  };

  const inventoryCards = [
    {
      id: "coupon",
      label: "Cupons sociais",
      value: `x${socialCouponCount}`,
      helper: hasActiveSocialCoupon
        ? `Timer ativo: ${socialCouponRemainingMinutes} min`
        : "30 min livres por uso",
      Icon: Ticket,
      accent: "text-sky-100",
      border: "border-sky-400/35",
      bg: "bg-[linear-gradient(135deg,rgba(14,165,233,0.22),rgba(9,9,11,0.96))]",
    },
    {
      id: "pass",
      label: "Passe Livre",
      value: `x${passFreeCount}`,
      helper: "Conclua uma task sem contar para a loot box",
      Icon: ShieldCheck,
      accent: "text-amber-100",
      border: "border-amber-400/35",
      bg: "bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(9,9,11,0.96))]",
    },
    {
      id: "boost",
      label: "XP Boost",
      value: `x${xpBoostCount}`,
      helper: hasActiveXpMultiplier
        ? `1.5x ativo por mais ${xpMultiplierRemainingMinutes} min`
        : "Ative na mochila para ganhar 1.5x XP por 2h",
      Icon: Sparkles,
      accent: hasActiveXpMultiplier ? "text-violet-300" : "text-violet-200",
      border: hasActiveXpMultiplier ? "border-violet-500/20" : "border-violet-500/30",
      bg: hasActiveXpMultiplier
        ? "bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(9,9,11,0.96))]"
        : "bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(9,9,11,0.96))]",
    },
  ];

  const notificationClasses = {
    success: "border-l-emerald-500 bg-emerald-500/10 text-emerald-300",
    error: "border-l-red-500 bg-red-500/10 text-red-300",
    locked: "border-l-yellow-500 bg-yellow-500/10 text-yellow-300",
    common: `${BOX_RARITY_META.common.toastClass} border-l-zinc-400`,
    rare: `${BOX_RARITY_META.rare.toastClass} border-l-sky-400`,
    epic: `${BOX_RARITY_META.epic.toastClass} border-l-violet-400`,
    legendary: `${BOX_RARITY_META.legendary.toastClass} border-l-amber-400`,
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-sm">Loja de</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              Mimos e Recompensas
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-2xl border border-amber-500/30">
            <Gift size={18} className="text-amber-400" />
            <span className="font-mono font-bold text-amber-400 text-lg">
              {totalGold}
            </span>
          </div>
        </div>

        {notification && (
          <Card
            className={`p-4 border-l-4 ${notificationClasses[notification.type] || notificationClasses.success}`}
          >
            <p className="text-sm font-semibold">{notification.message}</p>
          </Card>
        )}

        <Card className="border-amber-500/30 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_42%),linear-gradient(180deg,_rgba(24,24,27,0.96),_rgba(9,9,11,0.98))]">
          <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80">
                Caixa Misteriosa
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Loot Box estilo arena
              </h2>
            </div>

            <div className="grid items-stretch gap-6 md:grid-cols-2">
              <div className="min-w-0 rounded-3xl border border-zinc-800 bg-zinc-950/55 p-5 text-center md:text-left">
                <p className="text-sm leading-7 text-zinc-300">
                  Abra caixas para disputar drops comuns, raros, epicos e
                  lendarios. Cada 10 tarefas concluidas enchem a barra, resetam
                  o progresso e adicionam +1 caixa ao inventario.
                </p>
              </div>

              <div className="min-w-0 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5 text-center md:text-left">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Arena Sync
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Qualquer tarefa com texto entra no ciclo de XP e loot box.
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  Progresso atual no ciclo: {boxProgress}/{taskProgressTarget}
                </p>
              </div>
            </div>

            <div className="w-full">
              <LootBoxWidget
                boxesCount={boxesCount}
                boxProgress={boxProgress}
                taskProgressTarget={taskProgressTarget}
                onOpenBox={handleOpenBox}
                isOpeningBox={isOpeningBox || isOpening}
              />
            </div>
          </div>
        </Card>

        <div className="mx-auto grid w-full max-w-[800px] grid-cols-3 items-stretch gap-6">
          {inventoryCards.map((item) => (
            <Card
              key={item.id}
              className={`h-full p-4 ${item.border} ${item.bg} shadow-[0_12px_30px_rgba(0,0,0,0.18)]`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-300/75">
                  {item.label}
                </p>
                <item.Icon size={16} className={item.accent} />
              </div>
              <p className="mt-3 text-lg font-bold text-white">{item.value}</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">{item.helper}</p>
            </Card>
          ))}
        </div>

        {Object.entries(TIER_COLORS).map(([tier, colors]) => {
          const tierRewards = REWARDS_CATALOG.filter((reward) => reward.tier === tier);

          return (
            <div key={tier} className="space-y-3">
              <h3 className="mt-6 flex items-center gap-2 text-sm uppercase font-bold tracking-widest text-zinc-400">
                <div className={`h-4 w-1 ${colors.badge.split(" ")[0]}`} />
                {colors.label}
              </h3>

              <div className="grid gap-3">
                {tierRewards.map((reward) => {
                  const isLocked = currentLevel < reward.minLvl;
                  const canAfford = totalGold >= reward.cost;
                  const isPurchased = purchasedItems.has(reward.id);
                  const Icon = reward.icon;

                  return (
                    <Card
                      key={reward.id}
                      className={`${colors.bg} ${colors.border} border transition-all ${
                        isLocked ? "opacity-60 grayscale" : ""
                      } ${isPurchased ? "ring-2 ring-emerald-500" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Icon size={14} className={colors.badge.split(" ")[1]} />
                            <span
                              className={`rounded-lg px-2 py-1 text-xs font-bold ${colors.badge}`}
                            >
                              {colors.label}
                            </span>
                          </div>

                          <h4 className="font-bold leading-tight text-white">
                            {reward.name}
                          </h4>
                          <p className="mt-1 mb-2 text-xs text-zinc-500">
                            {reward.description}
                          </p>

                          <p className="text-xs text-zinc-600">
                            {isLocked ? (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Lock size={12} />
                                Desbloqueado no nivel {reward.minLvl}
                              </span>
                            ) : (
                              <span className="text-emerald-500">
                                Liberado para resgate
                              </span>
                            )}
                          </p>
                        </div>

                        <Button
                          disabled={isLocked || !canAfford}
                          onClick={() => handlePurchase(reward)}
                          variant={isLocked ? "outline" : isPurchased ? "primary" : "ghost"}
                          className={`shrink-0 ${
                            isPurchased
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                              : ""
                          }`}
                        >
                          {isPurchased ? (
                            <span className="text-sm font-bold">Resgatado</span>
                          ) : isLocked ? (
                            <Lock size={14} />
                          ) : !canAfford ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <span className="text-sm font-bold">{reward.cost} Gold</span>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Card className="bg-zinc-800/50 border-zinc-700/50 text-center">
          <p className="text-xs leading-relaxed text-zinc-500">
            Dica: mantenha o ritmo nas tarefas para gerar caixas, abrir boosts e
            empilhar recursos raros no inventario.
          </p>
        </Card>
      </div>

      <MysteryBoxModal
        isOpen={isBoxModalOpen}
        reward={result}
        isOpening={isOpening}
        showResult={showResult}
        onSpinComplete={handleBoxSpinComplete}
        onClose={handleCloseBox}
      />
    </>
  );
}

export default StoreView;
