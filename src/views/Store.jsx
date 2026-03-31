import { useContext, useState, useEffect } from "react";
import { Lock, Gift, Zap, Target, Crown } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";

// Definição de recompensas com tier e requisitos
const REWARDS_CATALOG = [
  // ⚡ Rápidas (Tier 1)
  { 
    id: 1, 
    name: "30 min Redes Sociais", 
    description: "Instagram, TikTok ou YouTube",
    cost: 50, 
    tier: 'fast', 
    minLvl: 1,
    icon: Zap
  },
  { 
    id: 2, 
    name: "1 Episódio de Série", 
    description: "Seu anime/série favorita",
    cost: 50, 
    tier: 'fast', 
    minLvl: 1,
    icon: Zap
  },
  { 
    id: 3, 
    name: "30 min Gaming", 
    description: "Jogar seu jogo favorito",
    cost: 75, 
    tier: 'fast', 
    minLvl: 2,
    icon: Zap
  },

  // 🎯 Médias (Tier 2)
  { 
    id: 4, 
    name: "Pedir um Lanche 🍔", 
    description: "Pizza, hambúrguer ou comida favorita",
    cost: 300, 
    tier: 'medium', 
    minLvl: 5,
    icon: Target
  },
  { 
    id: 5, 
    name: "2h Maratona (Série/Gaming)", 
    description: "Tempo ilimitado no seu hobby",
    cost: 350, 
    tier: 'medium', 
    minLvl: 5,
    icon: Target
  },
  { 
    id: 6, 
    name: "Ir ao Cinema 🍿", 
    description: "Filme de sua escolha",
    cost: 400, 
    tier: 'medium', 
    minLvl: 6,
    icon: Target
  },

  // 👑 Épicas (Tier 3)
  { 
    id: 7, 
    name: "Novo Mouse / Teclado 🖱️", 
    description: "Setup upgrade",
    cost: 1500, 
    tier: 'epic', 
    minLvl: 10,
    icon: Crown
  },
  { 
    id: 8, 
    name: "Dia Livre (Sem Estudar)", 
    description: "Descanse culpado de tudo",
    cost: 1200, 
    tier: 'epic', 
    minLvl: 10,
    icon: Crown
  },
  { 
    id: 9, 
    name: "Monitoria Desbloqueada 🎓", 
    description: "Ajuda VIP para projetos",
    cost: 2000, 
    tier: 'epic', 
    minLvl: 12,
    icon: Crown
  },
];

// Cores por tier
const TIER_COLORS = {
  fast: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
    label: '⚡ Rápida',
  },
  medium: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-400',
    label: '🎯 Média',
  },
  epic: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400',
    label: '👑 Épica',
  },
};

export function StoreView() {
  const { totalGold, spendGold, currentLevel } = useContext(AppContext);
  const [purchasedItems, setPurchasedItems] = useState(new Set());
  const [notification, setNotification] = useState(null);

  // Sincronizar dados de ouro em tempo real
  useEffect(() => {
    const syncRealtimeGold = async () => {
      const userId = "default_user"; // Mesmo ID usado em AppContext
      const { data, error } = await supabase
        .from('user_profile')
        .select('total_gold, current_level')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao sincronizar ouro:', error);
      }
      // Se sucesso, o componente já renderiza com totalGold atualizado do AppContext
    };

    // Sincronizar a cada 2 segundos ou quando há mudança
    const interval = setInterval(syncRealtimeGold, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async (reward) => {
    const isLocked = currentLevel < reward.minLvl;
    const canAfford = totalGold >= reward.cost;

    if (isLocked) {
      setNotification({
        type: 'locked',
        message: `Desbloqueado no nível ${reward.minLvl}!`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!canAfford) {
      setNotification({
        type: 'poor',
        message: `Você precisa de mais ${reward.cost - totalGold} ouro!`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Efetuar compra com Supabase
    const result = await spendGold(reward.cost);
    
    if (result.success) {
      setPurchasedItems(new Set([...purchasedItems, reward.id]));
      
      setNotification({
        type: 'success',
        message: `✅ ${reward.name} desbloqueado! Aproveite! 🎉`
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'error',
        message: result.message || 'Erro ao processar compra'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header com Saldo de Ouro */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm">Loja de</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">Mimos & Recompensas</h1>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-2xl border border-amber-500/30">
          <Gift size={18} className="text-amber-400" />
          <span className="font-mono font-bold text-amber-400 text-lg">{totalGold}</span>
        </div>
      </div>

      {/* Notificação */}
      {notification && (
        <Card className={`p-4 border-l-4 ${
          notification.type === 'success' 
            ? 'border-l-emerald-500 bg-emerald-500/10' 
            : notification.type === 'locked'
            ? 'border-l-yellow-500 bg-yellow-500/10'
            : 'border-l-red-500 bg-red-500/10'
        }`}>
          <p className={`text-sm font-semibold ${
            notification.type === 'success' 
              ? 'text-emerald-400' 
              : notification.type === 'locked'
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {notification.message}
          </p>
        </Card>
      )}

      {/* Categorização por Tier */}
      {Object.entries(TIER_COLORS).map(([tier, colors]) => {
        const tierRewards = REWARDS_CATALOG.filter(r => r.tier === tier);
        if (tierRewards.length === 0) return null;

        return (
          <div key={tier} className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-zinc-400 tracking-widest flex items-center gap-2 mt-6">
              <div className={`w-1 h-4 ${colors.badge.split(' ')[0]}`} />
              {colors.label}
            </h3>

            <div className="grid gap-3">
              {tierRewards.map(reward => {
                const isLocked = currentLevel < reward.minLvl;
                const canAfford = totalGold >= reward.cost;
                const isPurchased = purchasedItems.has(reward.id);
                const Icon = reward.icon;

                return (
                  <Card
                    key={reward.id}
                    className={`${colors.bg} ${colors.border} border transition-all ${
                      isLocked ? 'opacity-60 grayscale' : ''
                    } ${isPurchased ? 'ring-2 ring-emerald-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className={colors.badge.split(' ')[1]} />
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.badge}`}>
                            {colors.label.split(' ')[1]}
                          </span>
                        </div>

                        <h4 className="text-white font-bold leading-tight">
                          {reward.name}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 mb-2">
                          {reward.description}
                        </p>

                        <p className="text-xs text-zinc-600">
                          {isLocked ? (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <Lock size={12} /> Desbloqueado em Nível {reward.minLvl}
                            </span>
                          ) : (
                            <span className="text-emerald-600">✓ Desbloqueado</span>
                          )}
                        </p>
                      </div>

                      <Button
                        disabled={isLocked || !canAfford}
                        onClick={() => handlePurchase(reward)}
                        variant={isLocked ? 'outline' : isPurchased ? 'default' : 'ghost'}
                        className={`shrink-0 ${
                          isPurchased ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : ''
                        }`}
                      >
                        {isPurchased ? (
                          <span className="text-sm font-bold">✓ Resgatado</span>
                        ) : isLocked ? (
                          <Lock size={14} />
                        ) : !canAfford ? (
                          <Alert size={14} />
                        ) : (
                          <span className="text-sm font-bold">{reward.cost} ⭐</span>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Rodapé com Info */}
      <Card className="bg-zinc-800/50 border-zinc-700/50 text-center">
        <p className="text-xs text-zinc-500 leading-relaxed">
          💡 <span className="text-zinc-400">Dica:</span> Ganhe mais XP completando tarefas para desbloquear recompensas épicas!
        </p>
      </Card>
    </div>
  );
}
