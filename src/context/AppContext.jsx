import { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";

export const AppContext = createContext(null);

// ===== TABELA DE RECOMPENSAS =====
export const XP_REWARDS = {
  SIMPLE_TASK: 10,        // Tarefa simples (checklist)
  POMODORO: 25,           // Sessão Pomodoro (25 min)
  DEEP_WORK: 50,          // Tarefa de estudo/deep work
  DAILY_COMPLETE: 100,    // Bônus por completar 100% do dia
};

// Bônus de ouro ao subir de nível
const GOLD_PER_LEVEL = 50;

// Fórmula quadrática para XP necessário: 100 * L^2
const getXpForLevel = (level) => {
  if (level <= 0) return 0;
  return 100 * Math.pow(level, 2);
};

export function AppProvider({ children }) {
  const [view, setView] = useState("dashboard");
  
  // Estado de gamificação
  const [totalXp, setTotalXp] = useState(() => {
    const saved = localStorage.getItem("lifeos_xp");
    return saved ? parseInt(saved) : 0;
  });

  const [totalGold, setTotalGold] = useState(() => {
    const saved = localStorage.getItem("lifeos_gold");
    return saved ? parseInt(saved) : 100; // Começar com 100 de ouro
  });

  // Estado para sincronização com Supabase
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = "default_user"; // MVP: usuário padrão (integrar com auth depois)

  // Buscar estatísticas do usuário do Supabase ao iniciar
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Usuário não existe, criar um novo registro
          const { data: newUser, error: insertError } = await supabase
            .from('user_profile')
            .insert([{
              id: userId,
              current_xp: totalXp,
              current_level: currentLevel,
              total_gold: totalGold,
            }])
            .select()
            .single();

          if (!insertError) {
            setUserStats(newUser);
          }
        } else if (!error && data) {
          setUserStats(data);
          // Sincronizar com localStorage se necessário
          setTotalXp(data.current_xp || 0);
          setTotalGold(data.total_gold || 100);
        }
      } catch (err) {
        console.error('Erro ao buscar stats do usuário:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // ===== CÁLCULOS DE XP E NÍVEL =====
  let currentLevel = 1;
  let xpSpent = 0;

  // Encontrar o nível atual
  while (xpSpent + getXpForLevel(currentLevel + 1) <= totalXp) {
    xpSpent += getXpForLevel(currentLevel + 1);
    currentLevel += 1;
  }

  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const xpProgress = totalXp - xpSpent;
  const xpProgressPercent = Math.round((xpProgress / nextLevelXp) * 100);

  // ===== PERSISTÊNCIA =====
  useEffect(() => {
    localStorage.setItem("lifeos_xp", totalXp.toString());
    
    // Sincronizar com Supabase
    if (userStats) {
      const syncXp = async () => {
        // Recalcular nível baseado no novo XP
        let newLevel = 1;
        let xpSpentLoop = 0;
        while (xpSpentLoop + getXpForLevel(newLevel + 1) <= totalXp) {
          xpSpentLoop += getXpForLevel(newLevel + 1);
          newLevel += 1;
        }

        const { error } = await supabase
          .from('user_profile')
          .update({ current_xp: totalXp, current_level: newLevel })
          .eq('id', userId);

        if (error) console.error('Erro ao sincronizar XP:', error);
      };
      syncXp();
    }
  }, [totalXp, userStats, userId]);

  useEffect(() => {
    localStorage.setItem("lifeos_gold", totalGold.toString());
    
    // Sincronizar com Supabase
    if (userStats) {
      const syncGold = async () => {
        const { error } = await supabase
          .from('user_profile')
          .update({ total_gold: totalGold })
          .eq('id', userId);

        if (error) console.error('Erro ao sincronizar Ouro:', error);
      };
      syncGold();
    }
  }, [totalGold, userStats, userId]);

  // ===== FUNÇÕES DE REWARD =====

  // Adicionar XP com sistema de level-up
  const addXp = useCallback((amount, reason = "DEFAULT") => {
    setTotalXp(prev => {
      const newXp = prev + amount;
      const nextThreshold = getXpForLevel(currentLevel + 1);

      // Detectar level-up
      if (newXp >= (xpSpent + nextThreshold)) {
        const newLevel = currentLevel + 1;
        const goldBonus = newLevel * GOLD_PER_LEVEL;
        
        // Adicionar ouro de bônus
        setTotalGold(prevGold => prevGold + goldBonus);
        
        // Alert de level-up
        alert(`🎉 LEVEL UP! Você alcançou o nível ${newLevel}!\n⭐ +${goldBonus} ouro como bônus!`);
      }

      return newXp;
    });
  }, [currentLevel, xpSpent]);

  // Adicionar ouro
  const addGold = useCallback((amount, reason = "DEFAULT") => {
    setTotalGold(prev => Math.max(0, prev + amount));
  }, []);

  // Subtrair ouro (para compras) - COM SUPABASE
  const spendGold = useCallback(async (amount) => {
    if (totalGold < amount) {
      alert("❌ Saldo insuficiente!");
      return { success: false, message: "Saldo insuficiente!" };
    }

    const newGoldAmount = totalGold - amount;

    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('user_profile')
        .update({ total_gold: newGoldAmount })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar ouro:', error);
        alert(`❌ Erro ao processar compra: ${error.message}`);
        return { success: false, message: error.message };
      }

      // Se sucesso, atualizar local
      setTotalGold(newGoldAmount);
      
      // Disparar animação de confete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Mensagem de sucesso com estilo
      alert("🎉 Recompensa resgatada! Aproveite seu momento.");
      
      return { 
        success: true, 
        message: `✅ Compra realizada! -${amount} ⭐`,
        newBalance: newGoldAmount
      };

    } catch (err) {
      console.error('Erro na compra:', err);
      alert(`❌ Erro inesperado: ${err.message}`);
      return { success: false, message: err.message };
    }
  }, [totalGold, userId]);

  // Executar reward baseado em tipo de ação
  const executeReward = useCallback((rewardType) => {
    const amount = XP_REWARDS[rewardType] || 0;
    const goldAmount = Math.floor(amount / 2); // Ganha ouro proporcional ao XP

    if (amount > 0) {
      addXp(amount, rewardType);
      addGold(goldAmount, rewardType);

      return {
        xp: amount,
        gold: goldAmount,
        message: `+${amount} XP | +${goldAmount} ⭐`
      };
    }
  }, [addXp, addGold]);

  return (
    <AppContext.Provider 
      value={{ 
        // Navegação
        view, 
        setView, 
        dateStr,

        // XP e Leveling
        totalXp,
        addXp,
        currentLevel,
        xpProgress,
        nextLevelXp,
        xpProgressPercent,

        // Ouro/Moeda
        totalGold,
        addGold,
        spendGold,

        // Sistema de Rewards
        executeReward,
        XP_REWARDS,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
