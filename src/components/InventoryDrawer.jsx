import { useContext, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Ticket,
  TimerReset,
  X,
  Zap,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { FinanceContext } from "../context/FinanceContext";
import {
  INVENTORY_ITEM_KEYS,
  INVENTORY_ITEM_META,
  INVENTORY_ITEM_ORDER,
} from "../lib/inventory";
import { Button } from "./Button";

const ITEM_ICONS = {
  [INVENTORY_ITEM_KEYS.SOCIAL_COUPON]: Ticket,
  [INVENTORY_ITEM_KEYS.XP_BOOST]: Zap,
  [INVENTORY_ITEM_KEYS.PASS_FREE]: ShieldCheck,
};

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

export function InventoryDrawer({ isOpen, onClose }) {
  const {
    inventoryItems,
    inventoryCountByKey,
    isInventoryLoading,
    activateInventoryItem,
    hasActiveSocialCoupon,
    activeSocialCouponExpiresAt,
    hasActiveXpMultiplier,
    profile,
  } = useContext(AppContext);
  const { tasks } = useContext(FinanceContext);
  const [activatingKey, setActivatingKey] = useState(null);
  const [selectingPassFree, setSelectingPassFree] = useState(false);
  const [inlineMessage, setInlineMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const isMutating = Boolean(activatingKey);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isOpen]);

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !task.done &&
            (task?.label?.replace(/\s+/g, " ").trim() ?? "").length > 0
        )
        .sort((left, right) => left.time.localeCompare(right.time)),
    [tasks]
  );

  const socialCouponRemainingMs =
    hasActiveSocialCoupon && activeSocialCouponExpiresAt
      ? Math.max(0, new Date(activeSocialCouponExpiresAt).getTime() - now)
      : 0;
  const xpBoostRemainingMs =
    hasActiveXpMultiplier && profile?.xp_multiplier_expires_at
      ? Math.max(0, new Date(profile.xp_multiplier_expires_at).getTime() - now)
      : 0;

  const handleActivateItem = async (itemKey) => {
    setInlineMessage("");

    if (itemKey === INVENTORY_ITEM_KEYS.PASS_FREE) {
      if (pendingTasks.length === 0) {
        setInlineMessage("Voce precisa de pelo menos uma task pendente com texto.");
        return;
      }

      setSelectingPassFree(true);
      return;
    }

    setActivatingKey(itemKey);
    const result = await activateInventoryItem(itemKey);
    setActivatingKey(null);

    if (!result?.success) {
      setInlineMessage(result?.message || "Nao foi possivel ativar esse item.");
      return;
    }
  };

  const handleUsePassFree = async (taskId) => {
    setActivatingKey(INVENTORY_ITEM_KEYS.PASS_FREE);
    const result = await activateInventoryItem(INVENTORY_ITEM_KEYS.PASS_FREE, {
      taskId,
    });
    setActivatingKey(null);

    if (!result?.success) {
      setInlineMessage(result?.message || "Falha ao usar o Passe Livre.");
      return;
    }

    setSelectingPassFree(false);
    setInlineMessage("");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-black/65 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={isMutating ? undefined : onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-amber-500/25 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.99))] shadow-[-20px_0_60px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/75">
              Mochila Arena
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Itens e consumiveis
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              Ative boosts, cupons e passes especiais direto do seu inventario.
            </p>
          </div>

          <button
            type="button"
            onClick={isMutating ? undefined : onClose}
            disabled={isMutating}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-3 text-zinc-400 transition hover:border-amber-500/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Fechar mochila"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Cupom ativo
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {hasActiveSocialCoupon
                  ? formatCountdown(socialCouponRemainingMs)
                  : "Nenhum timer ativo"}
              </p>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                {hasActiveSocialCoupon
                  ? "Seu tempo social esta correndo."
                  : "Ative um cupom para abrir a janela de 30 minutos."}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                XP Boost
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {hasActiveXpMultiplier
                  ? formatCountdown(xpBoostRemainingMs)
                  : "Inativo"}
              </p>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                {hasActiveXpMultiplier
                  ? "Bonus global de 1.5x XP em andamento."
                  : "Ative um boost para acelerar seu grind por 2 horas."}
              </p>
            </div>
          </div>

          {inlineMessage ? (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {inlineMessage}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {isInventoryLoading ? (
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 px-4 py-6 text-sm text-zinc-400">
                Carregando sua mochila...
              </div>
            ) : (
              INVENTORY_ITEM_ORDER.map((itemKey) => {
                const itemMeta = INVENTORY_ITEM_META[itemKey];
                const item = inventoryItems.find(
                  (entry) => entry.item_key === itemKey
                );
                const quantity = inventoryCountByKey[itemKey] ?? item?.quantity ?? 0;
                const Icon = ITEM_ICONS[itemKey] ?? TimerReset;
                const isBusy = activatingKey === itemKey;
                const isDisabled =
                  quantity <= 0 ||
                  (itemKey === INVENTORY_ITEM_KEYS.SOCIAL_COUPON &&
                    hasActiveSocialCoupon &&
                    !isBusy);

                return (
                  <div
                    key={itemKey}
                    className={`relative overflow-hidden rounded-[1.6rem] border bg-white/[0.02] p-4 backdrop-blur ${itemMeta.border}`}
                  >
                    <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                      x{quantity}
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 ${itemMeta.accent}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1 pr-14">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-white">
                            {itemMeta.label}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${itemMeta.badge}`}
                          >
                            Arena
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {itemMeta.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-zinc-500">
                        {itemKey === INVENTORY_ITEM_KEYS.PASS_FREE
                          ? `${pendingTasks.length} tasks elegiveis`
                          : itemKey === INVENTORY_ITEM_KEYS.XP_BOOST && hasActiveXpMultiplier
                            ? "Boost global em andamento"
                            : itemKey === INVENTORY_ITEM_KEYS.SOCIAL_COUPON && hasActiveSocialCoupon
                              ? "Timer social ja iniciado"
                              : "Pronto para ativar"}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => void handleActivateItem(itemKey)}
                        disabled={isDisabled || isBusy}
                        className="min-w-[112px] justify-center"
                      >
                        {isBusy ? "ATIVANDO..." : "ATIVAR"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectingPassFree && (
            <div className="mt-5 rounded-[1.6rem] border border-amber-500/30 bg-amber-500/10 p-4 shadow-[0_0_28px_rgba(245,158,11,0.14)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300/80">
                    Passe Livre
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Escolha uma task pendente
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectingPassFree(false)}
                >
                  Cancelar
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => void handleUsePassFree(task.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-500/15 bg-zinc-950/75 px-4 py-3 text-left transition hover:border-amber-500/40 hover:bg-zinc-950"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{task.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">{task.time}</p>
                    </div>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200">
                      Selecionar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default InventoryDrawer;
