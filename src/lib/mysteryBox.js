export const BOX_RARITY_WEIGHTS = [
  { rarity: "common", weight: 70 },
  { rarity: "rare", weight: 20 },
  { rarity: "epic", weight: 8 },
  { rarity: "legendary", weight: 2 },
];

export const BOX_RARITY_META = {
  common: {
    label: "Comum",
    badgeClass: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    glowClass: "shadow-[0_0_32px_rgba(161,161,170,0.22)]",
    toastClass: "border-zinc-500/40 bg-zinc-900/95 text-zinc-100",
    accentClass: "text-zinc-300",
  },
  rare: {
    label: "Raro",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    glowClass: "shadow-[0_0_40px_rgba(56,189,248,0.24)]",
    toastClass: "border-sky-500/40 bg-sky-950/90 text-sky-100",
    accentClass: "text-sky-300",
  },
  epic: {
    label: "Epico",
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    glowClass: "shadow-[0_0_42px_rgba(139,92,246,0.3)]",
    toastClass: "border-violet-500/40 bg-violet-950/90 text-violet-100",
    accentClass: "text-violet-300",
  },
  legendary: {
    label: "Lendario",
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    glowClass: "shadow-[0_0_48px_rgba(245,158,11,0.34)]",
    toastClass: "border-amber-500/50 bg-amber-950/90 text-amber-100",
    accentClass: "text-amber-200",
  },
};

export const BOX_REWARDS_BY_RARITY = {
  common: [
    {
      id: "common_xp",
      rarity: "common",
      type: "xp",
      title: "+50 XP",
      description: "Explosao de progresso imediato.",
      xp: 50,
      iconKey: "xp",
    },
    {
      id: "common_gold",
      rarity: "common",
      type: "gold",
      title: "+20 Gold",
      description: "Moedas para gastar na loja.",
      gold: 20,
      iconKey: "gold",
    },
  ],
  rare: [
    {
      id: "rare_xp",
      rarity: "rare",
      type: "xp",
      title: "+150 XP",
      description: "Uma recompensa mais forte para acelerar o nivel.",
      xp: 150,
      iconKey: "xp",
    },
    {
      id: "rare_coupon",
      rarity: "rare",
      type: "social_coupon",
      title: "Cupom 30 min Redes Sociais",
      description: "Um cupom extra para relaxar sem culpa.",
      count: 1,
      iconKey: "coupon",
    },
  ],
  epic: [
    {
      id: "epic_xp_boost",
      rarity: "epic",
      type: "xp_boost",
      title: "Boost 1.5x XP",
      description: "Guarde na mochila e ative por 2 horas quando quiser.",
      durationMinutes: 120,
      multiplier: 1.5,
      iconKey: "boost",
    },
    {
      id: "epic_gold",
      rarity: "epic",
      type: "gold",
      title: "+500 Gold",
      description: "Um drop pesado para a sua economia.",
      gold: 500,
      iconKey: "gold",
    },
  ],
  legendary: [
    {
      id: "legendary_pass",
      rarity: "legendary",
      type: "pass_free",
      title: "Passe Livre",
      description: "Pule uma tarefa sem perder sua streak.",
      count: 1,
      iconKey: "pass",
    },
  ],
};

export const ALL_BOX_REWARDS = Object.values(BOX_REWARDS_BY_RARITY).flat();

export function getRandomUnit() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] / 4294967296;
  }

  return Math.random();
}

function pickWeightedEntry(entries, randomValue) {
  const weightedEntries = entries.map((entry) => ({
    ...entry,
    weight: entry.weight ?? 1,
  }));
  const totalWeight = weightedEntries.reduce(
    (sum, entry) => sum + entry.weight,
    0
  );
  const threshold = randomValue * totalWeight;
  let cumulative = 0;

  for (const entry of weightedEntries) {
    cumulative += entry.weight;
    if (threshold < cumulative) {
      return entry;
    }
  }

  return weightedEntries[weightedEntries.length - 1];
}

export function rollMysteryReward() {
  const rarityRoll = getRandomUnit();
  const rewardRoll = getRandomUnit();
  const selectedRarity = pickWeightedEntry(BOX_RARITY_WEIGHTS, rarityRoll).rarity;
  const rarityRewards = BOX_REWARDS_BY_RARITY[selectedRarity];

  return pickWeightedEntry(rarityRewards, rewardRoll);
}

export function buildRouletteSequence(finalReward, length = 28, stopIndex = 21) {
  const items = [];

  for (let index = 0; index < length; index += 1) {
    if (index === stopIndex) {
      items.push(finalReward);
      continue;
    }

    items.push(
      ALL_BOX_REWARDS[
        Math.floor(getRandomUnit() * ALL_BOX_REWARDS.length)
      ]
    );
  }

  return {
    items,
    stopIndex,
  };
}

export function getRewardToastContent(reward) {
  return {
    title: `${BOX_RARITY_META[reward.rarity].label}: ${reward.title}`,
    message: reward.description,
    rarity: reward.rarity,
  };
}
