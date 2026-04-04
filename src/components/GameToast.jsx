import { Award, Crown, Gem, ShieldCheck } from "lucide-react";
import { BOX_RARITY_META } from "../lib/mysteryBox";

const TOAST_ICONS = {
  common: Award,
  rare: Gem,
  epic: Crown,
  legendary: ShieldCheck,
};

export function GameToast({ toast }) {
  if (!toast) {
    return null;
  }

  const rarityMeta = BOX_RARITY_META[toast.rarity] ?? BOX_RARITY_META.common;
  const Icon = TOAST_ICONS[toast.rarity] ?? Award;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-3xl border px-4 py-4 backdrop-blur-xl ${rarityMeta.toastClass} ${rarityMeta.glowClass}`}
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
          <Icon size={18} className={rarityMeta.accentClass} />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">
            Caixa Misteriosa
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{toast.title}</p>
          <p className="mt-1 text-sm text-white/75">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}

export default GameToast;
