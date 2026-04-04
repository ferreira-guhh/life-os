import { Gift, PackageOpen, Sparkles } from "lucide-react";
import Button from "./Button";

export function LootBoxWidget({
  boxesCount,
  boxProgress,
  taskProgressTarget,
  onOpenBox,
  isOpeningBox,
}) {
  const progressPercent = Math.min(
    100,
    Math.round(((boxProgress ?? 0) / taskProgressTarget) * 100)
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-4 rounded-[1.75rem] border border-amber-500/35 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-5 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.26em] text-amber-300/75">
            Caixa Misteriosa
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-300">{boxesCount}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Inventario sincronizado
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
          <Gift size={20} />
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Proxima loot box
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {boxProgress}/{taskProgressTarget} tarefas concluidas no ciclo
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-amber-300">
            <PackageOpen size={18} />
            <span className="font-mono text-sm">{progressPercent}%</span>
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <Button
        size="lg"
        onClick={onOpenBox}
        disabled={boxesCount <= 0 || isOpeningBox}
        className="w-full shadow-[0_0_30px_rgba(245,158,11,0.2)]"
      >
        {isOpeningBox ? (
          <>
            <Sparkles size={16} className="animate-spin" />
            Abrindo caixa...
          </>
        ) : (
          <>
            <Gift size={16} />
            Abrir Caixa
          </>
        )}
      </Button>
    </div>
  );
}

export default LootBoxWidget;
