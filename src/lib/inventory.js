export const INVENTORY_ITEM_KEYS = {
  SOCIAL_COUPON: "social_coupon",
  XP_BOOST: "xp_boost",
  PASS_FREE: "pass_free",
};

export const INVENTORY_ITEM_META = {
  [INVENTORY_ITEM_KEYS.SOCIAL_COUPON]: {
    key: INVENTORY_ITEM_KEYS.SOCIAL_COUPON,
    label: "Cupom Social",
    description: "Libera 30 minutos de pausa social com timer dedicado.",
    accent: "text-sky-200",
    border: "border-sky-500/30",
    badge: "bg-sky-500/12 text-sky-200 border-sky-500/30",
  },
  [INVENTORY_ITEM_KEYS.XP_BOOST]: {
    key: INVENTORY_ITEM_KEYS.XP_BOOST,
    label: "XP Boost",
    description: "Ative 1.5x XP durante as proximas 2 horas.",
    accent: "text-violet-200",
    border: "border-violet-500/30",
    badge: "bg-violet-500/12 text-violet-200 border-violet-500/30",
  },
  [INVENTORY_ITEM_KEYS.PASS_FREE]: {
    key: INVENTORY_ITEM_KEYS.PASS_FREE,
    label: "Passe Livre",
    description: "Conclua uma task pendente sem contar para a loot box.",
    accent: "text-amber-100",
    border: "border-amber-500/30",
    badge: "bg-amber-500/12 text-amber-100 border-amber-500/30",
  },
};

export const INVENTORY_ITEM_ORDER = [
  INVENTORY_ITEM_KEYS.SOCIAL_COUPON,
  INVENTORY_ITEM_KEYS.XP_BOOST,
  INVENTORY_ITEM_KEYS.PASS_FREE,
];

export const createEmptyInventory = () =>
  INVENTORY_ITEM_ORDER.map((itemKey) => ({
    user_id: null,
    item_key: itemKey,
    quantity: 0,
    updated_at: null,
  }));

export const normalizeInventoryItems = (items = [], userId = null) => {
  const itemsByKey = new Map(
    INVENTORY_ITEM_ORDER.map((itemKey) => [
      itemKey,
      {
        user_id: userId,
        item_key: itemKey,
        quantity: 0,
        updated_at: null,
      },
    ])
  );

  items.forEach((item) => {
    if (!item?.item_key || !itemsByKey.has(item.item_key)) {
      return;
    }

    itemsByKey.set(item.item_key, {
      user_id: item.user_id ?? userId,
      item_key: item.item_key,
      quantity: Math.max(0, item.quantity ?? 0),
      updated_at: item.updated_at ?? null,
    });
  });

  return INVENTORY_ITEM_ORDER.map((itemKey) => itemsByKey.get(itemKey));
};

export const getInventoryQuantityMap = (items = []) =>
  items.reduce((accumulator, item) => {
    accumulator[item.item_key] = Math.max(0, item.quantity ?? 0);
    return accumulator;
  }, {});
