import { useContext } from "react";
import {
  Gift,
  Target,
  Sparkles,
  GraduationCap,
  Briefcase,
  SunMedium,
  MoonStar,
  Wallet,
  Receipt,
  Coins,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { Card } from "./Card";
import { Button } from "./Button";

const QUEST_ICONS = {
  study: GraduationCap,
  work: Briefcase,
  tasks: Target,
  flame: Sparkles,
  sun: SunMedium,
  moon: MoonStar,
  wallet: Wallet,
  expense: Receipt,
  income: Coins,
  balance: Gift,
};

export function MissionBoard() {
  const {
    activeDailyQuests,
    dailyQuestBoard,
    activateDailyQuest,
    dailyQuestSlotsRemaining,
    showToast,
  } = useContext(AppContext);

  const handleActivateQuest = (questId) => {
    const result = activateDailyQuest(questId);

    if (!result.success) {
      showToast({
        title: "Missao indisponivel",
        message: result.message,
        rarity: "common",
      });
      return;
    }

    showToast({
      title: "Missao ativada",
      message: `${result.quest?.title ?? "Novo objetivo"} entrou no seu radar.`,
      rarity: "rare",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/25 bg-[linear-gradient(180deg,rgba(36,36,39,0.95),rgba(12,10,9,0.98))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300/75">
              Objetivos do Dia
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">
              Ate 3 missoes ativas por rodada diaria
            </h2>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Slots
            </p>
            <p className="text-sm font-semibold text-amber-200">
              {activeDailyQuests.length}/3
            </p>
          </div>
        </div>

        {activeDailyQuests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-5 text-sm leading-7 text-zinc-500">
            Ative missoes no quadro abaixo para montar sua rota diaria de XP, gold e consistencia.
          </div>
        ) : (
          <div className="space-y-3">
            {activeDailyQuests.map((quest) => {
              const Icon = QUEST_ICONS[quest.iconKey] ?? Target;
              const progressPercent = Math.min(
                100,
                Math.round((quest.progress / quest.target) * 100)
              );

              return (
                <div
                  key={quest.id}
                  className={`rounded-[1.5rem] border p-4 transition-all ${
                    quest.isCompleted
                      ? "border-emerald-500/35 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.14)]"
                      : "border-amber-500/30 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.12)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                        quest.isCompleted
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                          : "border-amber-500/30 bg-zinc-950/70 text-amber-300"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {quest.title}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-zinc-400">
                            {quest.description}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
                            quest.isCompleted
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                              : "border-amber-500/30 bg-amber-500/15 text-amber-200"
                          }`}
                        >
                          {quest.isCompleted ? "Concluida" : "Ativa"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>
                          Progresso {quest.progress}/{quest.target}
                        </span>
                        <span className="text-amber-200">
                          +{quest.xpReward} XP | +{quest.goldReward} gold
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            quest.isCompleted
                              ? "bg-emerald-400"
                              : "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="border-amber-500/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_42%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-amber-300/80">
              Quadro de Missoes
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">
              5 quests geradas para o seu perfil de hoje
            </h2>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Livres
            </p>
            <p className="text-sm font-semibold text-white">
              {dailyQuestSlotsRemaining}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {dailyQuestBoard.map((quest) => {
            const Icon = QUEST_ICONS[quest.iconKey] ?? Target;
            const progressPercent = Math.min(
              100,
              Math.round((quest.progress / quest.target) * 100)
            );

            return (
              <div
                key={quest.id}
                className={`rounded-[1.6rem] border p-4 transition-all ${
                  quest.isCompleted
                    ? "border-emerald-500/35 bg-emerald-500/10"
                    : quest.isActive
                      ? "border-amber-500/65 bg-amber-500/10 shadow-[0_0_34px_rgba(245,158,11,0.16)]"
                      : "border-zinc-800 bg-zinc-900/90 hover:border-amber-500/45 hover:shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                      quest.isCompleted
                        ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-200"
                        : quest.isActive
                          ? "border-amber-500/35 bg-amber-500/15 text-amber-200"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {quest.title}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-zinc-400">
                          {quest.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-amber-200">
                          +{quest.xpReward} XP
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          +{quest.goldReward} gold
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          <span>Progresso</span>
                          <span>
                            {quest.progress}/{quest.target}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              quest.isCompleted
                                ? "bg-emerald-400"
                                : quest.isActive
                                  ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
                                  : "bg-zinc-700"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={
                          quest.isCompleted
                            ? "outline"
                            : quest.isActive
                              ? "primary"
                              : "ghost"
                        }
                        disabled={
                          quest.isCompleted ||
                          quest.isActive ||
                          dailyQuestSlotsRemaining <= 0
                        }
                        onClick={() => handleActivateQuest(quest.id)}
                        className={`shrink-0 ${
                          quest.isActive
                            ? "shadow-[0_0_30px_rgba(245,158,11,0.18)]"
                            : ""
                        }`}
                      >
                        {quest.isCompleted
                          ? "Concluida"
                          : quest.isActive
                            ? "Ativa"
                            : "Ativar Missao"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default MissionBoard;
