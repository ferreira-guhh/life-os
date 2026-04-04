/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

const toAppError = (error, fallbackMessage) =>
  error instanceof Error ? error : new Error(fallbackMessage);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Erro ao carregar sessao:", error);
      }

      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setIsAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setPendingAction(null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async ({ email, password }) => {
    setPendingAction("signin");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setPendingAction(null);
      return { error };
    }

    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    setPendingAction(null);

    return { error: null };
  };

  const handleSignUp = async ({ fullName, email, password }) => {
    setPendingAction("signup");

    try {
      const cleanFullName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: cleanFullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      const createdUser = data?.user ?? null;
      const userId = createdUser?.id ?? null;
      const hasIdentities =
        !Array.isArray(createdUser?.identities) || createdUser.identities.length > 0;

      if (!createdUser || !userId) {
        console.error("Cadastro sem user valido retornado pelo Supabase:", {
          data,
        });

        return {
          error: new Error("Nao foi possivel confirmar a criacao do usuario."),
        };
      }

      if (!data.session && !hasIdentities) {
        console.error("Supabase nao confirmou a criacao real do usuario:", {
          data,
        });

        return {
          error: new Error(
            "Nao foi possivel confirmar a criacao do usuario. Esse email pode ja estar cadastrado."
          ),
        };
      }

      if (!isUuid(userId)) {
        console.error("Supabase retornou um user.id invalido para profiles:", {
          userId,
          user: createdUser,
        });

        return {
          error: new Error("O identificador do usuario retornado nao eh um UUID valido."),
        };
      }

      try {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userId,
          full_name: cleanFullName,
          xp: 0,
          level: 1,
          gold: 100,
          streak: 0,
          boxes_count: 0,
          box_progress: 0,
          total_tasks_completed: 0,
          last_box_milestone_claimed: 0,
          social_coupon_count: 0,
          pass_free_count: 0,
          xp_multiplier_expires_at: null,
          onboarding_completed: false,
          productive_period: null,
          focus_area: null,
        });

        if (profileError) {
          console.error("Erro ao criar profile apos signUp:", {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            userId,
          });

          return { error: profileError };
        }
      } catch (databaseError) {
        console.error("Excecao inesperada ao criar profile apos signUp:", {
          userId,
          databaseError,
        });

        return {
          error: toAppError(databaseError, "Erro inesperado ao criar o perfil."),
        };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      return {
        error: null,
        requiresEmailConfirmation: !data.session,
      };
    } finally {
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    setPendingAction("signout");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setPendingAction(null);
      return { error };
    }

    setSession(null);
    setUser(null);
    setPendingAction(null);

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthLoading,
        pendingAction,
        handleSignIn,
        handleSignUp,
        handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
