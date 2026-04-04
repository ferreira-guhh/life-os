import { useContext } from "react";
import { House, LoaderCircle, LogOut } from "lucide-react";
import { AppProvider, AppContext } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import { Button } from "./components/Button";
import { GameToast } from "./components/GameToast";
import { OnboardingModal } from "./components/OnboardingModal";
import { DashboardView } from "./views/Dashboard";
import { FinanceView } from "./views/Finance";
import { FocusView } from "./views/Focus";
import { HomeHubView } from "./views/HomeHub";
import { LoginView } from "./views/Login";
import { MissionsView } from "./views/Missions";
import { StoreView } from "./views/Store";
import "./index.css";

function AppShell() {
  const {
    view,
    setView,
    toast,
    profile,
    onboardingCompleted,
    completeOnboarding,
    isSavingOnboarding,
    productivePeriodOptions,
    focusAreaOptions,
  } = useContext(AppContext);
  const { user, handleSignOut, pendingAction } = useAuth();

  const views = {
    hub: HomeHubView,
    tasks: DashboardView,
    finance: FinanceView,
    store: StoreView,
    missions: MissionsView,
    focus: FocusView,
  };

  const ActiveView = views[view] || HomeHubView;
  const isSigningOut = pendingAction === "signout";
  const isHubView = view === "hub";
  const shellWidths = {
    hub: "max-w-6xl",
    tasks: "max-w-4xl",
    finance: "max-w-6xl",
    store: "max-w-5xl",
    missions: "max-w-5xl",
    focus: "max-w-3xl",
  };
  const shellWidth = shellWidths[view] || "max-w-5xl";

  const handleLogoutClick = async () => {
    const { error } = await handleSignOut();

    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className={`${shellWidth} mx-auto px-4 pt-4 pb-28 sm:px-6 lg:px-8`}>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Sessao ativa
            </p>
            <p className="truncate text-sm text-zinc-200">
              {user?.email || "Usuario autenticado"}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogoutClick}
            disabled={isSigningOut}
            className="shrink-0"
          >
            {isSigningOut ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <LogOut size={15} />
            )}
            Sair
          </Button>
        </div>
        <ActiveView user={user} />
      </div>
      {!isHubView && (
        <button
          type="button"
          onClick={() => setView("hub")}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/35 bg-zinc-950/95 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.18)] transition hover:border-amber-400 hover:text-amber-100"
          aria-label="Voltar para o Hub"
        >
          <House size={20} />
        </button>
      )}
      <GameToast toast={toast} />
      <OnboardingModal
        isOpen={Boolean(profile) && !onboardingCompleted}
        productivePeriodOptions={productivePeriodOptions}
        focusAreaOptions={focusAreaOptions}
        onSubmit={completeOnboarding}
        isSaving={isSavingOnboarding}
      />
    </div>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-4 text-sm text-zinc-300">
          <LoaderCircle size={18} className="animate-spin text-amber-400" />
          Validando sua sessao...
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { session, user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <FinanceProvider key={user.id}>
      <AppProvider key={user.id} user={user}>
        <AppShell />
      </AppProvider>
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { font-family: 'Syne', sans-serif; box-sizing: border-box; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        .pb-safe { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
        .active\\:scale-95:active { transform: scale(0.95); }
        .active\\:scale-98:active { transform: scale(0.98); }
        .wave { display: inline-block; animation: wave 2s ease-in-out infinite; }
        .xp-float-up {
          animation: xpFloatUp 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .xp-float-down {
          animation: xpFloatDown 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .xp-float-neutral {
          animation: xpFloatNeutral 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(20deg); }
          40% { transform: rotate(-10deg); }
        }
        @keyframes xpFloatUp {
          0% { opacity: 0; transform: translate3d(0, 14px, 0) scale(0.96); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(0, -18px, 0) scale(1.04); }
        }
        @keyframes xpFloatDown {
          0% { opacity: 0; transform: translate3d(0, -10px, 0) scale(0.96); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(0, 18px, 0) scale(1); }
        }
        @keyframes xpFloatNeutral {
          0% { opacity: 0; transform: translate3d(0, 6px, 0) scale(0.98); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(0, -10px, 0) scale(1); }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 99px; }
        select option { background: #18181b; }
      `}</style>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </>
  );
}
