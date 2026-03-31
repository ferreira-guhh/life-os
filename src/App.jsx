import { useContext } from "react";
import { AppProvider, AppContext } from "./context/AppContext";
import { FinanceProvider } from "./context/FinanceContext";
import { BottomNav } from "./components/BottomNav";
import { DashboardView } from "./views/Dashboard";
import { FinanceView } from "./views/Finance";
import { FocusView } from "./views/Focus";
import { StoreView } from "./views/Store";
import './index.css'

function AppShell() {
  const { view } = useContext(AppContext);

  const views = {
    dashboard: DashboardView,
    finance: FinanceView,
    store: StoreView,
    focus: FocusView,
  };

  const ActiveView = views[view] || DashboardView;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
        <ActiveView />
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <FinanceProvider>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
          * { font-family: 'Syne', sans-serif; box-sizing: border-box; }
          .font-mono { font-family: 'JetBrains Mono', monospace !important; }
          .pb-safe { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
          .active\\:scale-95:active { transform: scale(0.95); }
          .active\\:scale-98:active { transform: scale(0.98); }
          .wave { display: inline-block; animation: wave 2s ease-in-out infinite; }
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(20deg); }
            40% { transform: rotate(-10deg); }
          }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 99px; }
          select option { background: #18181b; }
        `}</style>
        <AppShell />
      </FinanceProvider>
    </AppProvider>
  );
}
 