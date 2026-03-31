import { useContext } from "react";
import { LayoutDashboard, Wallet, Timer, Gift } from "lucide-react";
import { AppContext } from "../context/AppContext";

export function BottomNav() {
  const { view, setView } = useContext(AppContext);

  const tabs = [
    { id: "dashboard", label: "Início", Icon: LayoutDashboard },
    { id: "finance", label: "Finanças", Icon: Wallet },
    { id: "store", label: "Loja", Icon: Gift },
    { id: "focus", label: "Foco", Icon: Timer },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 pb-safe">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                active ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
