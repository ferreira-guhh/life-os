import { useState } from "react";
import { LoaderCircle, LockKeyhole, LogIn, Mail, User, UserPlus } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export function LoginView() {
  const { handleSignIn, handleSignUp, pendingAction } = useAuth();
  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(null);

  const isBusy = pendingAction === "signin" || pendingAction === "signup";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanFullName = fullName.trim();

    if (!cleanEmail || !cleanPassword) {
      setFeedback({
        type: "error",
        message: "Preencha email e senha para continuar.",
      });
      return;
    }

    if (mode === "signup" && !cleanFullName) {
      setFeedback({
        type: "error",
        message: "Informe seu nome completo para criar a conta.",
      });
      return;
    }

    setFeedback(null);

    if (mode === "signin") {
      const { error } = await handleSignIn({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setFeedback({
          type: "error",
          message: error.message,
        });
      }

      return;
    }

    const { error, requiresEmailConfirmation } = await handleSignUp({
      fullName: cleanFullName,
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      setFeedback({
        type: "error",
        message: error.message,
      });
      return;
    }

    setFeedback({
      type: "success",
      message: requiresEmailConfirmation
        ? "Conta criada. Verifique seu email para confirmar o cadastro."
        : "Conta criada com sucesso. Entrando no LifeOS...",
    });
  };

  const submitLabel =
    mode === "signin"
      ? pendingAction === "signin"
        ? "Entrando..."
        : "Entrar"
      : pendingAction === "signup"
        ? "Criando conta..."
        : "Criar conta";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_transparent_30%),radial-gradient(circle_at_80%_18%,_rgba(245,158,11,0.08),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_24%),linear-gradient(180deg,_#090909_0%,_#171209_45%,_#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.85)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.85)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute left-[-7rem] top-10 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="absolute right-[-5rem] top-1/3 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-300">
              LifeOS Access
            </span>
            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-bold leading-tight text-white sm:text-5xl">
                Entre para liberar seu dashboard.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">
                Um acesso simples para entrar no LifeOS, salvar seu progresso e
                manter suas metas sincronizadas com o Supabase.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Progressao
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  XP e nivel salvos no seu perfil
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Acesso
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Login rapido para voltar ao foco
                </p>
              </div>
            </div>
          </div>

          <Card className="border-zinc-800/80 bg-zinc-900/85 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Autenticacao
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {mode === "signin" ? "Entrar" : "Criar conta"}
                </h2>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
                {mode === "signin" ? (
                  <LogIn size={18} className="text-amber-400" />
                ) : (
                  <UserPlus size={18} className="text-amber-400" />
                )}
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setFeedback(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  mode === "signin"
                    ? "bg-amber-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFeedback(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-amber-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Criar conta
              </button>
            </div>

            {feedback && (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Nome completo
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 focus-within:border-amber-500">
                    <User size={16} className="text-zinc-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Email
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 focus-within:border-amber-500">
                  <Mail size={16} className="text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Senha
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 focus-within:border-amber-500">
                  <LockKeyhole size={16} className="text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={isBusy}>
                {isBusy ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : mode === "signin" ? (
                  <LogIn size={16} />
                ) : (
                  <UserPlus size={16} />
                )}
                {submitLabel}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
