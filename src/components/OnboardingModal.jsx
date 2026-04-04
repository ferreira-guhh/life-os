import { useMemo, useState } from "react";
import { MoonStar, Sparkles, SunMedium, Target, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "./Button";

const PERIOD_ICONS = {
  morning: SunMedium,
  night: MoonStar,
  flexible: Sparkles,
};

const FOCUS_ICONS = {
  studies: GraduationCap,
  work: Briefcase,
  general: Target,
};

function OptionCard({
  option,
  iconMap,
  isSelected,
  onSelect,
}) {
  const Icon = iconMap[option.value] ?? Sparkles;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`rounded-[1.5rem] border p-4 text-left transition-all ${
        isSelected
          ? "border-amber-500/70 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.18)]"
          : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
            isSelected
              ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
              : "border-zinc-800 bg-zinc-950 text-zinc-400"
          }`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{option.label}</p>
          <p className="mt-1 text-xs leading-6 text-zinc-400">
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function OnboardingModal({
  isOpen,
  productivePeriodOptions,
  focusAreaOptions,
  onSubmit,
  isSaving,
}) {
  const [productivePeriod, setProductivePeriod] = useState(
    productivePeriodOptions[0]?.value ?? ""
  );
  const [focusArea, setFocusArea] = useState(focusAreaOptions[0]?.value ?? "");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(
    () => Boolean(productivePeriod && focusArea && !isSaving),
    [focusArea, isSaving, productivePeriod]
  );

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!productivePeriod || !focusArea) {
      setErrorMessage("Escolha seu ritmo e seu foco antes de continuar.");
      return;
    }

    setErrorMessage("");

    const result = await onSubmit({
      productivePeriod,
      focusArea,
    });

    if (result?.error) {
      setErrorMessage(result.error.message || "Nao foi possivel salvar seu onboarding.");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_42%)]" />
      <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-amber-500/30 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-5 shadow-[0_0_80px_rgba(245,158,11,0.15)] sm:p-6">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/75">
            Onboarding LifeOS
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Vamos calibrar seu quadro de missoes.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
            Responda duas perguntas rapidas para personalizar quests, ritmo de jogo e a primeira rotina do seu dashboard.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-white">
              Qual seu periodo mais produtivo?
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {productivePeriodOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  iconMap={PERIOD_ICONS}
                  isSelected={productivePeriod === option.value}
                  onSelect={setProductivePeriod}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Qual seu foco principal?
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {focusAreaOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  iconMap={FOCUS_ICONS}
                  isSelected={focusArea === option.value}
                  onSelect={setFocusArea}
                />
              ))}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            O LifeOS vai usar isso para gerar suas daily quests.
          </p>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="sm:w-auto sm:min-w-[220px]"
          >
            {isSaving ? "Salvando perfil..." : "Entrar no quadro"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
