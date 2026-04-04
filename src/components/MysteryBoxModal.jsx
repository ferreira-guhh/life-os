import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Coins,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import {
  BOX_RARITY_META,
  buildRouletteSequence,
} from "../lib/mysteryBox";

const ITEM_WIDTH = 144;
const ITEM_GAP = 12;
const STEP_WIDTH = ITEM_WIDTH + ITEM_GAP;
export const MYSTERY_BOX_ROLL_DURATION_MS = 3000;

const REWARD_ICONS = {
  xp: Sparkles,
  gold: Coins,
  social_coupon: Ticket,
  xp_boost: Zap,
  pass_free: ShieldCheck,
};

function RewardCard({ reward, isFinal = false }) {
  const rarityMeta = BOX_RARITY_META[reward.rarity] ?? BOX_RARITY_META.common;
  const Icon = REWARD_ICONS[reward.type] ?? Box;

  return (
    <div
      className={`w-36 shrink-0 rounded-3xl border border-zinc-800 bg-zinc-900/95 p-4 transition-all ${
        isFinal ? `${rarityMeta.glowClass} border-amber-500/60 bg-zinc-900` : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] ${rarityMeta.badgeClass}`}
        >
          {rarityMeta.label}
        </span>
        <Icon size={16} className={rarityMeta.accentClass} />
      </div>
      <p className="text-sm font-semibold leading-snug text-white">
        {reward.title}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{reward.description}</p>
    </div>
  );
}

function MysteryBoxModalContent({
  reward,
  isOpening,
  showResult,
  onClose,
  onSpinComplete,
}) {
  const [trackStyle, setTrackStyle] = useState({
    transition: "none",
    transform: "translateX(0px)",
  });
  const viewportRef = useRef(null);
  const spinTimeoutRef = useRef(null);
  const hasCompletedSpinRef = useRef(false);

  const roulette = useMemo(() => {
    if (!reward) {
      return { items: [], stopIndex: 0 };
    }

    return buildRouletteSequence(reward);
  }, [reward]);

  const finishSpin = useCallback(() => {
    if (hasCompletedSpinRef.current) {
      return;
    }

    hasCompletedSpinRef.current = true;

    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }

    onSpinComplete?.();
  }, [onSpinComplete]);

  useEffect(() => {
    if (!isOpening || !reward) {
      return undefined;
    }

    let animationFrame = null;
    let nestedAnimationFrame = null;
    const viewportWidth = viewportRef.current?.clientWidth ?? 468;
    const stopOffset = viewportWidth / 2 - ITEM_WIDTH / 2;

    hasCompletedSpinRef.current = false;

    animationFrame = requestAnimationFrame(() => {
      nestedAnimationFrame = requestAnimationFrame(() => {
        setTrackStyle({
          transition: `transform ${MYSTERY_BOX_ROLL_DURATION_MS}ms cubic-bezier(0.08, 0.78, 0.18, 1)`,
          transform: `translateX(${stopOffset - roulette.stopIndex * STEP_WIDTH}px)`,
        });
      });
    });

    spinTimeoutRef.current = window.setTimeout(
      finishSpin,
      MYSTERY_BOX_ROLL_DURATION_MS + 80
    );

    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }

      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(nestedAnimationFrame);
    };
  }, [finishSpin, isOpening, reward, roulette.stopIndex]);

  const rarityMeta = BOX_RARITY_META[reward.rarity] ?? BOX_RARITY_META.common;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/78 px-4 backdrop-blur-md">
      <div className="absolute inset-0" onClick={isOpening ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-amber-500/30 bg-zinc-950/95 p-5 shadow-[0_0_80px_rgba(245,158,11,0.16)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Caixa Misteriosa
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {!isOpening && showResult ? "Premio revelado" : "Rolando o drop..."}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {!isOpening && showResult
                ? "A roleta travou no seu premio. Aproveite o drop."
                : "Segurando a emocao por 3 segundos, no melhor estilo CS e Valorant."}
            </p>
          </div>
          <button
            type="button"
            onClick={isOpening ? undefined : onClose}
            disabled={isOpening}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900/90 px-4 py-6"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-3 left-1/2 z-20 w-1 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]" />

          <div
            className="flex gap-3"
            style={trackStyle}
            onTransitionEnd={(event) => {
              if (event.propertyName !== "transform") {
                return;
              }

              if (isOpening) {
                finishSpin();
              }
            }}
          >
            {roulette.items.map((item, index) => (
              <RewardCard
                key={`${item.id}-${index}`}
                reward={item}
                isFinal={!isOpening && showResult && index === roulette.stopIndex}
              />
            ))}
          </div>
        </div>

        {!isOpening && showResult && (
          <div
            className={`mt-5 rounded-[1.75rem] border border-amber-500/40 bg-zinc-900/85 p-5 transition-all duration-500 ${rarityMeta.glowClass}`}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Resultado
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] ${rarityMeta.badgeClass}`}
                >
                  {rarityMeta.label}
                </span>
                <p className="mt-3 text-2xl font-bold text-white">{reward.title}</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                  {reward.description}
                </p>
              </div>
              <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:block">
                <RewardCard reward={reward} isFinal />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MysteryBoxModal({
  isOpen,
  reward,
  isOpening,
  showResult,
  onClose,
  onSpinComplete,
}) {
  if (!isOpen || !reward) {
    return null;
  }

  return (
    <MysteryBoxModalContent
      reward={reward}
      isOpening={isOpening}
      showResult={showResult}
      onClose={onClose}
      onSpinComplete={onSpinComplete}
    />
  );
}

export default MysteryBoxModal;
