import { ScrollText, Sparkles } from "lucide-react";
import { Card } from "../components/Card";
import { MissionBoard } from "../components/MissionBoard";

export function MissionsView() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24">
      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm">Daily Quests</p>
        <h1 className="mt-0.5 text-2xl font-bold text-white">
          Quadro de Missoes
        </h1>
      </div>

      <Card className="border-amber-500/25 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_35%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.26em] text-amber-300/80">
              Bounty Board
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Escolha ate 3 objetivos e deixe o LifeOS validar o drop automaticamente.
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              Missoes ativas brilham em amber, concluidas viram recompensa instantanea e tudo sincroniza com tasks e financas em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <ScrollText size={16} className="text-amber-300" />
                Arsenal
              </div>
              <p className="mt-2 font-semibold text-white">5 quests</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Sparkles size={16} className="text-amber-300" />
                Recompensa
              </div>
              <p className="mt-2 font-semibold text-white">XP + Gold</p>
            </div>
          </div>
        </div>
      </Card>

      <MissionBoard />
    </div>
  );
}

export default MissionsView;
