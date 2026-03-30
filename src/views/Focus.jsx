import { Play, Pause, RotateCcw, Flame, Zap } from "lucide-react";
import { usePomodoro } from "../hooks/usePomodoro";
import { Card } from "../components/Card";

const MODECONFIG = {
  focus: { color: "#f59e0b", bg: "bg-amber-500/20", text: "text-amber-400" },
  short: { color: "#34d399", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  long: { color: "#818cf8", bg: "bg-indigo-500/20", text: "text-indigo-400" },
};

export function FocusView() {
  const { mode, modes, timeLeft, running, sessions, switchMode, toggle, reset, fmt, progress } =
    usePomodoro();

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);
  const cfg = MODECONFIG[mode];

  return (
    <div className="space-y-4">
      <div className="pt-2 pb-1">
        <p className="text-zinc-500 text-sm">Produtividade</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">Modo Foco</h1>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(modes).map(([key, { label }]) => {
          const c = MODECONFIG[key];
          return (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === key
                  ? `${c.bg} ${c.text} border border-current/30`
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Timer Ring */}
      <div className="flex flex-col items-center py-6">
        <div className="relative w-56 h-56">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={cfg.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold text-white tracking-tight">
              {fmt(timeLeft)}
            </span>
            <span className={`text-sm mt-1 font-medium ${cfg.text}`}>
              {modes[mode].label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-all active:scale-95"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={toggle}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              running
                ? "bg-zinc-700 text-white"
                : `${cfg.bg.replace("/20", "")} text-white`
            }`}
            style={!running ? { background: cfg.color } : undefined}
          >
            {running ? (
              <Pause size={28} />
            ) : (
              <Play size={28} fill="currentColor" />
            )}
          </button>
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <span className={`text-lg font-bold font-mono ${cfg.text}`}>
              {sessions}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          Sessões de foco completadas hoje
        </p>
      </div>

      {/* Streak / Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs text-zinc-500">Sequência</span>
          </div>
          <p className="text-2xl font-bold font-mono text-orange-400">
            {sessions}
          </p>
          <p className="text-xs text-zinc-600">pomodoros hoje</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-400" />
            <span className="text-xs text-zinc-500">Tempo focado</span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {Math.round(sessions * 25)}
          </p>
          <p className="text-xs text-zinc-600">minutos totais</p>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-dashed border-zinc-700">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <span className="text-amber-400 font-semibold">
            Dica Pomodoro:
          </span>{" "}
          Trabalhe em blocos de 25 min com pausas de 5 min. A cada 4 sessões,
          faça uma pausa longa de 15 min.
        </p>
      </Card>
    </div>
  );
}
