import { useContext } from "react";
import { LayoutDashboard, Wallet, Timer, Gift } from "lucide-react";
import { AppContext } from "../context/AppContext";

export function BottomNav() {
  const { view, setView } = useContext(AppContext);

  const tabs = [
    { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
    { id: "finance", label: "Financas", icon: Wallet },
    { id: "store", label: "Loja", icon: Gift },
    { id: "focus", label: "Foco", icon: Timer },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 pb-safe">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                active ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
