/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import confetti from "canvas-confetti";
import { supabase } from "../lib/supabase";
import { FinanceContext } from "./FinanceContext";
import { getRewardToastContent, rollMysteryReward } from "../lib/mysteryBox";
import {
  INVENTORY_ITEM_KEYS,
  createEmptyInventory,
  getInventoryQuantityMap,
  normalizeInventoryItems,
} from "../lib/inventory";
import {
  FOCUS_AREA_OPTIONS,
  PRODUCTIVE_PERIOD_OPTIONS,
  evaluateQuestProgress,
  generateDailyQuests,
  getTodayKey,
} from "../lib/dailyQuests";

export const AppContext = createContext(null);

export const XP_REWARDS = {
  SIMPLE_TASK: 10,
  POMODORO: 25,
  DEEP_WORK: 50,
  DAILY_COMPLETE: 100,
};

export const TASK_PROGRESS_TARGET = 10;

const GOLD_PER_LEVEL = 50;
const XP_MULTIPLIER_VALUE = 1.5;
const SOCIAL_COUPON_DURATION_MS = 30 * 60 * 1000;
const XP_BOOST_DURATION_MS = 2 * 60 * 60 * 1000;
const MAX_ACTIVE_DAILY_QUESTS = 3;
const PROFILE_SELECT = [
  "id",
  "full_name",
  "xp",
  "level",
  "gold",
  "streak",
  "updated_at",
  "boxes_count",
  "box_progress",
  "total_tasks_completed",
  "last_box_milestone_claimed",
  "social_coupon_count",
  "pass_free_count",
  "xp_multiplier_expires_at",
  "onboarding_completed",
  "productive_period",
  "focus_area",
].join(", ");

const getXpForLevel = (level) => {
  if (level <= 0) {
    return 0;
  }

  return 100 * Math.pow(level, 2);
};

const getLevelSnapshot = (totalXp) => {
  let currentLevel = 1;
  let xpSpent = 0;

  while (xpSpent + getXpForLevel(currentLevel + 1) <= totalXp) {
    xpSpent += getXpForLevel(currentLevel + 1);
    currentLevel += 1;
  }

  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const xpProgress = totalXp - xpSpent;
  const xpProgressPercent = Math.round((xpProgress / nextLevelXp) * 100);

  return {
    currentLevel,
    xpSpent,
    nextLevelXp,
    xpProgress,
    xpProgressPercent,
  };
};

const getLevelUpGoldBonus = (fromLevel, toLevel) => {
  if (toLevel <= fromLevel) {
    return 0;
  }

  let bonus = 0;

  for (let level = fromLevel + 1; level <= toLevel; level += 1) {
    bonus += level * GOLD_PER_LEVEL;
  }

  return bonus;
};

const isXpMultiplierActive = (profile) => {
  if (!profile?.xp_multiplier_expires_at) {
    return false;
  }

  return new Date(profile.xp_multiplier_expires_at).getTime() > Date.now();
};

const normalizeTaskLabel = (task) =>
  task?.label?.replace(/\s+/g, " ").trim() ?? "";

export const isTaskEligibleForRewards = (task) =>
  normalizeTaskLabel(task).length > 0;

const getBoxProgressFromTotal = (totalTasksCompleted) =>
  Math.max(0, totalTasksCompleted ?? 0) % TASK_PROGRESS_TARGET;

const getMilestoneValue = (totalTasksCompleted) => {
  const normalizedTotal = Math.max(0, totalTasksCompleted ?? 0);

  if (
    normalizedTotal === 0 ||
    normalizedTotal % TASK_PROGRESS_TARGET !== 0
  ) {
    return 0;
  }

  return normalizedTotal;
};

const createEmptyDailyQuestState = (dateKey) => ({
  dateKey,
  available: [],
  activeIds: [],
  completedIds: [],
  progressById: {},
});

export function AppProvider({ children, user }) {
  const financeContext = useContext(FinanceContext);
  const tasks = useMemo(() => financeContext?.tasks ?? [], [financeContext?.tasks]);
  const transactions = useMemo(
    () => financeContext?.transactions ?? [],
    [financeContext?.transactions]
  );
  const summary = useMemo(
    () => financeContext?.summary ?? { balance: 0 },
    [financeContext?.summary]
  );
  const toggleTask = financeContext?.toggleTask;
  const setTaskRewardMeta = financeContext?.setTaskRewardMeta;
  const [view, setView] = useState("hub");
  const userId = user?.id ?? "default_user";
  const xpStorageKey = `lifeos_xp:${userId}`;
  const goldStorageKey = `lifeos_gold:${userId}`;
  const dailyQuestStorageKey = `lifeos_daily_quests:${userId}`;
  const socialCouponStorageKey = `lifeos_social_coupon:${userId}`;
  const [profile, setProfile] = useState(null);
  const [inventoryItems, setInventoryItems] = useState(() =>
    normalizeInventoryItems(createEmptyInventory(), userId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [activeSocialCouponExpiresAt, setActiveSocialCouponExpiresAt] = useState(
    null
  );
  const [dailyQuestState, setDailyQuestState] = useState(() =>
    createEmptyDailyQuestState(getTodayKey())
  );
  const initialXpRef = useRef(() => {
    const savedXp = localStorage.getItem(xpStorageKey);
    return savedXp ? parseInt(savedXp, 10) : 0;
  });
  const initialGoldRef = useRef(() => {
    const savedGold = localStorage.getItem(goldStorageKey);
    return savedGold ? parseInt(savedGold, 10) : 100;
  });
  const profileRef = useRef(null);
  const profileMutationIdRef = useRef(0);
  const inventoryRef = useRef(normalizeInventoryItems(createEmptyInventory(), userId));
  const inventoryMutationIdRef = useRef(0);
  const openingBoxRef = useRef(false);
  const dailyQuestStateRef = useRef(createEmptyDailyQuestState(getTodayKey()));
  const claimingQuestIdsRef = useRef(new Set());
  const isAuthenticated = Boolean(user?.id);

  const initialXp =
    typeof initialXpRef.current === "function"
      ? initialXpRef.current()
      : initialXpRef.current;
  const initialGold =
    typeof initialGoldRef.current === "function"
      ? initialGoldRef.current()
      : initialGoldRef.current;

  if (typeof initialXpRef.current === "function") {
    initialXpRef.current = initialXp;
  }

  if (typeof initialGoldRef.current === "function") {
    initialGoldRef.current = initialGold;
  }

  const today = new Date();
  const todayKey = getTodayKey(today);
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const totalXp = profile?.xp ?? initialXp;
  const totalGold = profile?.gold ?? initialGold;
  const {
    currentLevel,
    xpSpent,
    nextLevelXp,
    xpProgress,
    xpProgressPercent,
  } = getLevelSnapshot(totalXp);

  const normalizeProfile = useCallback(
    (value) => ({
      id: value?.id ?? userId,
      full_name:
        value?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Usuario",
      xp: value?.xp ?? initialXp,
      level: value?.level ?? getLevelSnapshot(value?.xp ?? initialXp).currentLevel,
      gold: value?.gold ?? initialGold,
      streak: value?.streak ?? 0,
      boxes_count: value?.boxes_count ?? 0,
      box_progress: value?.box_progress ?? 0,
      total_tasks_completed:
        value?.total_tasks_completed ??
        (Math.max(0, value?.boxes_count ?? 0) * TASK_PROGRESS_TARGET +
          Math.max(0, value?.box_progress ?? 0)),
      last_box_milestone_claimed:
        value?.last_box_milestone_claimed ??
        Math.max(0, value?.boxes_count ?? 0) * TASK_PROGRESS_TARGET,
      social_coupon_count: value?.social_coupon_count ?? 0,
      pass_free_count: value?.pass_free_count ?? 0,
      xp_multiplier_expires_at: value?.xp_multiplier_expires_at ?? null,
      onboarding_completed: value?.onboarding_completed ?? false,
      productive_period: value?.productive_period ?? null,
      focus_area: value?.focus_area ?? null,
      updated_at: value?.updated_at ?? null,
    }),
    [
      initialGold,
      initialXp,
      user?.email,
      user?.user_metadata?.full_name,
      user?.user_metadata?.name,
      userId,
    ]
  );

  const syncProfileRef = useCallback((nextProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  const syncInventoryState = useCallback(
    (nextItems) => {
      const normalizedItems = normalizeInventoryItems(nextItems, userId);
      inventoryRef.current = normalizedItems;
      setInventoryItems(normalizedItems);
    },
    [userId]
  );

  const syncDailyQuestState = useCallback(
    (nextState) => {
      dailyQuestStateRef.current = nextState;
      setDailyQuestState(nextState);

      if (!isAuthenticated || !user?.id) {
        return;
      }

      localStorage.setItem(dailyQuestStorageKey, JSON.stringify(nextState));
    },
    [dailyQuestStorageKey, isAuthenticated, user?.id]
  );

  const resetDailyQuestState = useCallback(() => {
    const nextState = createEmptyDailyQuestState(todayKey);
    dailyQuestStateRef.current = nextState;
    setDailyQuestState(nextState);
    claimingQuestIdsRef.current.clear();

    if (isAuthenticated && user?.id) {
      localStorage.removeItem(dailyQuestStorageKey);
    }
  }, [dailyQuestStorageKey, isAuthenticated, todayKey, user?.id]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    localStorage.setItem(xpStorageKey, totalXp.toString());
  }, [totalXp, xpStorageKey]);

  useEffect(() => {
    localStorage.setItem(goldStorageKey, totalGold.toString());
  }, [goldStorageKey, totalGold]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setActiveSocialCouponExpiresAt(null);
      return;
    }

    const storedCouponExpiresAt = localStorage.getItem(socialCouponStorageKey);
    setActiveSocialCouponExpiresAt(storedCouponExpiresAt || null);
  }, [isAuthenticated, socialCouponStorageKey, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      localStorage.removeItem(socialCouponStorageKey);
      return;
    }

    if (!activeSocialCouponExpiresAt) {
      localStorage.removeItem(socialCouponStorageKey);
      return;
    }

    localStorage.setItem(socialCouponStorageKey, activeSocialCouponExpiresAt);
  }, [
    activeSocialCouponExpiresAt,
    isAuthenticated,
    socialCouponStorageKey,
    user?.id,
  ]);

  useEffect(() => {
    if (!activeSocialCouponExpiresAt) {
      return undefined;
    }

    const remainingMs =
      new Date(activeSocialCouponExpiresAt).getTime() - Date.now();

    if (remainingMs <= 0) {
      setActiveSocialCouponExpiresAt(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveSocialCouponExpiresAt(null);
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeSocialCouponExpiresAt]);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          syncInventoryState(createEmptyInventory());
          setIsInventoryLoading(false);
        }
        return;
      }

      setIsInventoryLoading(true);

      const { data, error } = await supabase
        .from("inventory")
        .select("user_id, item_key, quantity, updated_at")
        .eq("user_id", userId);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Erro ao buscar inventory:", error);
        syncInventoryState(createEmptyInventory());
        setIsInventoryLoading(false);
        return;
      }

      syncInventoryState(data ?? createEmptyInventory());
      setIsInventoryLoading(false);
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, syncInventoryState, user?.id, userId]);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);

    const loadProfile = async () => {
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const fallbackProfile = normalizeProfile({
        id: userId,
        xp: initialXp,
        level: getLevelSnapshot(initialXp).currentLevel,
        gold: initialGold,
        boxes_count: 0,
        box_progress: 0,
        total_tasks_completed: 0,
        last_box_milestone_claimed: 0,
        onboarding_completed: false,
        productive_period: null,
        focus_area: null,
      });

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("id", userId)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("Erro ao buscar profile:", error);
          syncProfileRef(fallbackProfile);
          return;
        }

        if (!data) {
          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                full_name: fallbackProfile.full_name,
                xp: fallbackProfile.xp,
                level: fallbackProfile.level,
                gold: fallbackProfile.gold,
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
              },
              { onConflict: "id" }
            )
            .select(PROFILE_SELECT)
            .single();

          if (!isMounted) {
            return;
          }

          if (createError) {
            console.error("Erro ao criar profile:", createError);
            syncProfileRef(fallbackProfile);
            return;
          }

          syncProfileRef(normalizeProfile(createdProfile));
          return;
        }

        syncProfileRef(normalizeProfile(data));
      } catch (error) {
        console.error("Erro inesperado ao sincronizar profile:", error);
        if (isMounted) {
          syncProfileRef(
            normalizeProfile({
              id: userId,
              xp: initialXp,
              level: getLevelSnapshot(initialXp).currentLevel,
              gold: initialGold,
            })
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [
    initialGold,
    initialXp,
    isAuthenticated,
    normalizeProfile,
    syncProfileRef,
    user?.id,
    userId,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      resetDailyQuestState();
      return;
    }

    if (!profile?.onboarding_completed) {
      resetDailyQuestState();
      return;
    }

    claimingQuestIdsRef.current.clear();

    const buildQuestState = () => ({
      dateKey: todayKey,
      available: generateDailyQuests(
        {
          productive_period: profile?.productive_period,
          focus_area: profile?.focus_area,
        },
        {
        dateKey: todayKey,
        limit: 5,
        }
      ),
      activeIds: [],
      completedIds: [],
      progressById: {},
    });

    try {
      const rawState = localStorage.getItem(dailyQuestStorageKey);

      if (rawState) {
        const parsedState = JSON.parse(rawState);

        if (
          parsedState?.dateKey === todayKey &&
          Array.isArray(parsedState.available)
        ) {
          syncDailyQuestState({
            dateKey: todayKey,
            available: parsedState.available,
            activeIds: Array.isArray(parsedState.activeIds)
              ? parsedState.activeIds
              : [],
            completedIds: Array.isArray(parsedState.completedIds)
              ? parsedState.completedIds
              : [],
            progressById:
              parsedState.progressById &&
              typeof parsedState.progressById === "object"
                ? parsedState.progressById
                : {},
          });
          return;
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar daily quests:", error);
    }

    syncDailyQuestState(buildQuestState());
  }, [
    dailyQuestStorageKey,
    isAuthenticated,
    profile?.focus_area,
    profile?.onboarding_completed,
    profile?.productive_period,
    resetDailyQuestState,
    syncDailyQuestState,
    todayKey,
    user?.id,
  ]);

  const showToast = useCallback((nextToast) => {
    setToast({
      id: Date.now(),
      ...nextToast,
    });
  }, []);

  const persistProfilePatch = useCallback(
    async (partialUpdate) => {
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return {
          error: new Error("Perfil ainda nao foi carregado."),
        };
      }

      const previousProfile = normalizeProfile(currentProfile);
      const nextProfile = normalizeProfile({
        ...previousProfile,
        ...partialUpdate,
      });
      const mutationId = profileMutationIdRef.current + 1;

      profileMutationIdRef.current = mutationId;
      syncProfileRef(nextProfile);

      const { data, error } = await supabase
        .from("profiles")
        .update(partialUpdate)
        .eq("id", userId)
        .select(PROFILE_SELECT)
        .single();

      if (error) {
        console.error("Erro ao sincronizar profile:", error);

        if (mutationId === profileMutationIdRef.current) {
          syncProfileRef(previousProfile);
        }

        return { error };
      }

      const normalizedProfile = normalizeProfile(data);

      if (mutationId === profileMutationIdRef.current) {
        syncProfileRef(normalizedProfile);
      }

      return {
        error: null,
        data:
          mutationId === profileMutationIdRef.current
            ? normalizedProfile
            : normalizeProfile(profileRef.current),
        previous: previousProfile,
      };
    },
    [normalizeProfile, syncProfileRef, userId]
  );

  const persistInventoryQuantity = useCallback(
    async (itemKey, nextQuantity) => {
      if (!isAuthenticated || !user?.id) {
        return { error: new Error("Usuario nao autenticado.") };
      }

      const previousItems = normalizeInventoryItems(inventoryRef.current, userId);
      const nextItems = previousItems.map((item) =>
        item.item_key === itemKey
          ? {
              ...item,
              quantity: Math.max(0, nextQuantity),
              updated_at: new Date().toISOString(),
            }
          : item
      );
      const mutationId = inventoryMutationIdRef.current + 1;

      inventoryMutationIdRef.current = mutationId;
      syncInventoryState(nextItems);

      let data = null;
      let error = null;

      if (nextQuantity <= 0) {
        const response = await supabase
          .from("inventory")
          .delete()
          .eq("user_id", userId)
          .eq("item_key", itemKey)
          .select("user_id, item_key, quantity, updated_at");

        data = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from("inventory")
          .upsert(
            {
              user_id: userId,
              item_key: itemKey,
              quantity: nextQuantity,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,item_key" }
          )
          .select("user_id, item_key, quantity, updated_at");

        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("Erro ao sincronizar inventory:", error);

        if (mutationId === inventoryMutationIdRef.current) {
          syncInventoryState(previousItems);
        }

        return { error };
      }

      const normalizedData =
        nextQuantity <= 0
          ? normalizeInventoryItems(nextItems, userId)
          : normalizeInventoryItems(
              Array.isArray(data)
                ? [
                    ...previousItems.filter((item) => item.item_key !== itemKey),
                    ...data,
                  ]
                : nextItems,
              userId
            );

      if (mutationId === inventoryMutationIdRef.current) {
        syncInventoryState(normalizedData);
      }

      return {
        error: null,
        data:
          mutationId === inventoryMutationIdRef.current
            ? normalizedData
            : normalizeInventoryItems(inventoryRef.current, userId),
        previous: previousItems,
      };
    },
    [isAuthenticated, syncInventoryState, user?.id, userId]
  );

  const adjustInventoryItem = useCallback(
    async (itemKey, delta) => {
      const currentItem = inventoryRef.current.find(
        (item) => item.item_key === itemKey
      );
      const nextQuantity = Math.max(0, (currentItem?.quantity ?? 0) + delta);

      return persistInventoryQuantity(itemKey, nextQuantity);
    },
    [persistInventoryQuantity]
  );

  const completeOnboarding = useCallback(
    async ({ productivePeriod, focusArea }) => {
      setIsSavingOnboarding(true);

      try {
        const { error, data } = await persistProfilePatch({
          productive_period: productivePeriod,
          focus_area: focusArea,
          onboarding_completed: true,
        });

        if (error) {
          return { error };
        }

        const nextState = {
          dateKey: todayKey,
          available: generateDailyQuests(data, {
            dateKey: todayKey,
            limit: 5,
          }),
          activeIds: [],
          completedIds: [],
          progressById: {},
        };

        syncDailyQuestState(nextState);

        return { error: null, profile: data };
      } finally {
        setIsSavingOnboarding(false);
      }
    },
    [persistProfilePatch, syncDailyQuestState, todayKey]
  );

  const activateDailyQuest = useCallback(
    (questId) => {
      const currentState = dailyQuestStateRef.current;

      if (!currentState?.available?.length) {
        return { success: false, message: "As missoes ainda nao foram geradas." };
      }

      if (currentState.activeIds.includes(questId)) {
        return { success: false, message: "Essa missao ja esta ativa." };
      }

      if (currentState.activeIds.length >= MAX_ACTIVE_DAILY_QUESTS) {
        return {
          success: false,
          message: "Voce ja ativou o limite de 3 missoes hoje.",
        };
      }

      const quest = currentState.available.find((entry) => entry.id === questId);

      if (!quest) {
        return { success: false, message: "Missao nao encontrada." };
      }

      const evaluation = evaluateQuestProgress(quest, {
        tasks,
        transactions,
        summary,
        todayKey,
      });

      const nextState = {
        ...currentState,
        activeIds: [...currentState.activeIds, questId],
        progressById: {
          ...currentState.progressById,
          [questId]: evaluation.progress,
        },
      };

      syncDailyQuestState(nextState);

      return { success: true, quest };
    },
    [summary, syncDailyQuestState, tasks, todayKey, transactions]
  );

  const claimCompletedDailyQuests = useCallback(
    async (questsToClaim) => {
      if (!questsToClaim.length) {
        return;
      }

      const currentProfile = profileRef.current;

      if (!currentProfile) {
        questsToClaim.forEach((quest) => {
          claimingQuestIdsRef.current.delete(quest.id);
        });
        return;
      }

      const totalXpReward = questsToClaim.reduce(
        (sum, quest) => sum + quest.xpReward,
        0
      );
      const totalGoldReward = questsToClaim.reduce(
        (sum, quest) => sum + quest.goldReward,
        0
      );
      const currentLevelValue =
        currentProfile.level ?? getLevelSnapshot(currentProfile.xp).currentLevel;
      const nextXp = currentProfile.xp + totalXpReward;
      const snapshot = getLevelSnapshot(nextXp);
      const levelBonusGold = getLevelUpGoldBonus(
        currentLevelValue,
        snapshot.currentLevel
      );

      const { error } = await persistProfilePatch({
        xp: nextXp,
        level: snapshot.currentLevel,
        gold: currentProfile.gold + totalGoldReward + levelBonusGold,
      });

      if (error) {
        questsToClaim.forEach((quest) => {
          claimingQuestIdsRef.current.delete(quest.id);
        });
        showToast({
          title: "Missao em espera",
          message: "Nao foi possivel aplicar a recompensa extra agora.",
          rarity: "common",
        });
        return;
      }

      const latestState = dailyQuestStateRef.current;

      if (latestState) {
        const completedIds = [
          ...new Set([
            ...latestState.completedIds,
            ...questsToClaim.map((quest) => quest.id),
          ]),
        ];
        const progressById = { ...latestState.progressById };

        questsToClaim.forEach((quest) => {
          progressById[quest.id] = quest.target;
          claimingQuestIdsRef.current.delete(quest.id);
        });

        syncDailyQuestState({
          ...latestState,
          completedIds,
          progressById,
        });
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.45 },
      });

      const firstQuest = questsToClaim[0];

      showToast({
        title:
          questsToClaim.length === 1
            ? "Missao concluida"
            : `${questsToClaim.length} missoes concluidas`,
        message:
          questsToClaim.length === 1
            ? `${firstQuest.title} | +${firstQuest.xpReward} XP e +${firstQuest.goldReward} gold`
            : `Bonus total: +${totalXpReward} XP e +${totalGoldReward} gold`,
        rarity: "epic",
      });
    },
    [persistProfilePatch, showToast, syncDailyQuestState]
  );

  const applyXpReward = useCallback(
    async ({ baseXp, baseGold = 0, useMultiplier = false }) => {
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return { error: new Error("Perfil ainda nao foi carregado.") };
      }

      const activeMultiplier =
        useMultiplier && isXpMultiplierActive(currentProfile)
          ? XP_MULTIPLIER_VALUE
          : 1;
      const xpGain = baseXp * activeMultiplier;
      const previousLevel = currentProfile.level ?? currentLevel;
      const newXp = currentProfile.xp + xpGain;
      const snapshot = getLevelSnapshot(newXp);
      const levelBonusGold = getLevelUpGoldBonus(
        previousLevel,
        snapshot.currentLevel
      );
      const newGold = currentProfile.gold + baseGold + levelBonusGold;

      const { error, data } = await persistProfilePatch({
        xp: newXp,
        level: snapshot.currentLevel,
        gold: newGold,
      });

      if (error) {
        return { error };
      }

      return {
        error: null,
        profile: data,
        xpGain,
        goldGain: baseGold,
        levelBonusGold,
        leveledUp: snapshot.currentLevel > previousLevel,
      };
    },
    [currentLevel, persistProfilePatch]
  );

  const addXp = useCallback(
    async (amount) => applyXpReward({ baseXp: amount, useMultiplier: true }),
    [applyXpReward]
  );

  const addGold = useCallback(
    async (amount) => {
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return { error: new Error("Perfil ainda nao foi carregado.") };
      }

      const { error, data } = await persistProfilePatch({
        gold: Math.max(0, currentProfile.gold + amount),
      });

      return {
        error,
        profile: data,
      };
    },
    [persistProfilePatch]
  );

  const spendGold = useCallback(
    async (amount) => {
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return { success: false, message: "Perfil ainda nao foi carregado." };
      }

      if (currentProfile.gold < amount) {
        return { success: false, message: "Saldo insuficiente!" };
      }

      const { error, data } = await persistProfilePatch({
        gold: currentProfile.gold - amount,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      return {
        success: true,
        message: `Compra realizada! -${amount} ouro`,
        newBalance: data.gold,
      };
    },
    [persistProfilePatch]
  );

  const executeReward = useCallback(
    async (rewardType) => {
      const baseXp = XP_REWARDS[rewardType] || 0;

      if (baseXp <= 0) {
        return null;
      }

      const activeMultiplier = isXpMultiplierActive(profileRef.current)
        ? XP_MULTIPLIER_VALUE
        : 1;
      const effectiveXp = baseXp * activeMultiplier;
      const goldGain = Math.floor(effectiveXp / 2);
      const result = await applyXpReward({
        baseXp,
        baseGold: goldGain,
        useMultiplier: true,
      });

      if (result.error) {
        return null;
      }

      return {
        xp: result.xpGain,
        gold: goldGain,
        message: `+${result.xpGain} XP | +${goldGain} ouro`,
      };
    },
    [applyXpReward]
  );

  const removeXp = useCallback(
    async (amount) => {
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return { success: false, message: "Perfil ainda nao foi carregado." };
      }

      const newXpAmount = Math.max(0, currentProfile.xp - amount);
      const snapshot = getLevelSnapshot(newXpAmount);
      const newGoldAmount = Math.max(
        0,
        currentProfile.gold - Math.floor(amount / 2)
      );

      const { error, data } = await persistProfilePatch({
        xp: newXpAmount,
        level: snapshot.currentLevel,
        gold: newGoldAmount,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: `-${amount} XP | -${Math.floor(amount / 2)} ouro`,
        newXp: data.xp,
        newGold: data.gold,
      };
    },
    [persistProfilePatch]
  );

  useEffect(() => {
    const currentProfile = profileRef.current;
    const currentState = dailyQuestStateRef.current;

    if (
      !currentProfile?.onboarding_completed ||
      !currentState?.available?.length ||
      currentState.activeIds.length === 0
    ) {
      return;
    }

    const questSnapshot = {
      tasks,
      transactions,
      summary,
      todayKey,
    };
    const nextProgressById = { ...currentState.progressById };
    const claimableQuests = [];
    let shouldSyncProgress = false;

    currentState.activeIds.forEach((questId) => {
      const quest = currentState.available.find((entry) => entry.id === questId);

      if (!quest) {
        return;
      }

      const evaluation = evaluateQuestProgress(quest, questSnapshot);
      const normalizedProgress = currentState.completedIds.includes(quest.id)
        ? quest.target
        : evaluation.progress;

      if ((nextProgressById[quest.id] ?? 0) !== normalizedProgress) {
        nextProgressById[quest.id] = normalizedProgress;
        shouldSyncProgress = true;
      }

      if (
        evaluation.completed &&
        !currentState.completedIds.includes(quest.id) &&
        !claimingQuestIdsRef.current.has(quest.id)
      ) {
        claimingQuestIdsRef.current.add(quest.id);
        claimableQuests.push(quest);
      }
    });

    if (shouldSyncProgress) {
      syncDailyQuestState({
        ...currentState,
        progressById: nextProgressById,
      });
    }

    if (claimableQuests.length > 0) {
      void claimCompletedDailyQuests(claimableQuests);
    }
  }, [
    claimCompletedDailyQuests,
    summary,
    syncDailyQuestState,
    tasks,
    todayKey,
    transactions,
  ]);

  const grantTaskCompletionReward = useCallback(
    async (task, options = {}) => {
      const { countForLootBox = true, source = "task" } = options;
      const currentProfile = profileRef.current;

      if (!currentProfile) {
        return {
          error: new Error("Perfil ainda nao foi carregado."),
          skipped: false,
        };
      }

      if (!isTaskEligibleForRewards(task)) {
        return {
          error: null,
          skipped: true,
          message: "Tarefas vazias nao geram XP nem contam para loot box.",
        };
      }

      const currentTotalTasksCompleted = Math.max(
        0,
        currentProfile.total_tasks_completed ?? 0
      );
      const currentLastBoxMilestoneClaimed = Math.max(
        0,
        currentProfile.last_box_milestone_claimed ?? 0
      );
      const currentLevelValue =
        currentProfile.level ?? getLevelSnapshot(currentProfile.xp).currentLevel;
      const activeMultiplier = isXpMultiplierActive(currentProfile)
        ? XP_MULTIPLIER_VALUE
        : 1;
      const xpGain = XP_REWARDS.SIMPLE_TASK * activeMultiplier;
      const baseGoldGain = Math.floor(xpGain / 2);
      const nextXp = currentProfile.xp + xpGain;
      const snapshot = getLevelSnapshot(nextXp);
      const levelBonusGold = getLevelUpGoldBonus(
        currentLevelValue,
        snapshot.currentLevel
      );
      const goldGain = baseGoldGain + levelBonusGold;
      const nextTotalTasksCompleted = countForLootBox
        ? currentTotalTasksCompleted + 1
        : currentTotalTasksCompleted;
      const nextBoxProgress = countForLootBox
        ? getBoxProgressFromTotal(nextTotalTasksCompleted)
        : currentProfile.box_progress ?? 0;
      const nextMilestoneValue = countForLootBox
        ? getMilestoneValue(nextTotalTasksCompleted)
        : 0;
      const boxesAwarded = countForLootBox
        ? nextMilestoneValue > currentLastBoxMilestoneClaimed
          ? 1
          : 0
        : 0;
      const nextBoxesCount = countForLootBox
        ? (currentProfile.boxes_count ?? 0) + boxesAwarded
        : currentProfile.boxes_count ?? 0;
      const nextLastBoxMilestoneClaimed = countForLootBox
        ? boxesAwarded > 0
          ? nextMilestoneValue
          : currentLastBoxMilestoneClaimed
        : currentLastBoxMilestoneClaimed;

      const { error, data } = await persistProfilePatch({
        xp: nextXp,
        level: snapshot.currentLevel,
        gold: currentProfile.gold + goldGain,
        boxes_count: nextBoxesCount,
        box_progress: nextBoxProgress,
        total_tasks_completed: nextTotalTasksCompleted,
        last_box_milestone_claimed: nextLastBoxMilestoneClaimed,
      });

      if (error) {
        return { error, skipped: false };
      }

      if (boxesAwarded > 0) {
        showToast({
          title: "Nova Caixa Misteriosa",
          message: `Milestone ${nextMilestoneValue} alcancado. +${boxesAwarded} caixa liberada.`,
          rarity: "legendary",
        });
      }

      return {
        error: null,
        skipped: false,
        xp: xpGain,
        gold: goldGain,
        boxesAwarded,
        profile: data,
        rewardMeta: {
          rewarded: true,
          taskId: task?.id ?? null,
          xpGain,
          goldGain,
          totalTasksDelta: countForLootBox ? 1 : 0,
          source,
        },
      };
    },
    [persistProfilePatch, showToast]
  );

  const rewardTaskCompletion = useCallback(
    async (task) => grantTaskCompletionReward(task),
    [grantTaskCompletionReward]
  );

  const activateSocialCoupon = useCallback(async () => {
    const currentQuantity =
      inventoryRef.current.find(
        (item) => item.item_key === INVENTORY_ITEM_KEYS.SOCIAL_COUPON
      )?.quantity ?? 0;

    if (currentQuantity <= 0) {
      return { success: false, message: "Voce nao tem cupons sociais na mochila." };
    }

    const { error } = await adjustInventoryItem(
      INVENTORY_ITEM_KEYS.SOCIAL_COUPON,
      -1
    );

    if (error) {
      return { success: false, message: error.message };
    }

    const baseTime =
      activeSocialCouponExpiresAt &&
      new Date(activeSocialCouponExpiresAt).getTime() > Date.now()
        ? new Date(activeSocialCouponExpiresAt).getTime()
        : Date.now();

    const nextExpiresAt = new Date(baseTime + SOCIAL_COUPON_DURATION_MS).toISOString();
    setActiveSocialCouponExpiresAt(nextExpiresAt);

    showToast({
      title: "Cupom ativado",
      message: "30 minutos de pausa social liberados na arena.",
      rarity: "rare",
    });

    return { success: true, expiresAt: nextExpiresAt };
  }, [activeSocialCouponExpiresAt, adjustInventoryItem, showToast]);

  const activateXpBoost = useCallback(async () => {
    const currentProfile = profileRef.current;
    const currentQuantity =
      inventoryRef.current.find(
        (item) => item.item_key === INVENTORY_ITEM_KEYS.XP_BOOST
      )?.quantity ?? 0;

    if (!currentProfile) {
      return { success: false, message: "Perfil ainda nao foi carregado." };
    }

    if (currentQuantity <= 0) {
      return { success: false, message: "Voce nao tem boosts de XP disponiveis." };
    }

    const { error: inventoryError } = await adjustInventoryItem(
      INVENTORY_ITEM_KEYS.XP_BOOST,
      -1
    );

    if (inventoryError) {
      return { success: false, message: inventoryError.message };
    }

    const baseTime = isXpMultiplierActive(currentProfile)
      ? new Date(currentProfile.xp_multiplier_expires_at).getTime()
      : Date.now();
    const nextExpiresAt = new Date(baseTime + XP_BOOST_DURATION_MS).toISOString();

    const { error } = await persistProfilePatch({
      xp_multiplier_expires_at: nextExpiresAt,
    });

    if (error) {
      await adjustInventoryItem(INVENTORY_ITEM_KEYS.XP_BOOST, 1);
      return { success: false, message: error.message };
    }

    showToast({
      title: "XP Boost ativado",
      message: "Todo XP agora vale 1.5x pelas proximas 2 horas.",
      rarity: "epic",
    });

    return { success: true, expiresAt: nextExpiresAt };
  }, [adjustInventoryItem, persistProfilePatch, showToast]);

  const activatePassFreeOnTask = useCallback(
    async (taskId) => {
      if (typeof toggleTask !== "function" || typeof setTaskRewardMeta !== "function") {
        return { success: false, message: "As tasks ainda nao estao prontas." };
      }

      const task = tasks.find((entry) => entry.id === taskId);
      const currentQuantity =
        inventoryRef.current.find(
          (item) => item.item_key === INVENTORY_ITEM_KEYS.PASS_FREE
        )?.quantity ?? 0;

      if (!task || task.done) {
        return { success: false, message: "Escolha uma task pendente valida." };
      }

      if (!isTaskEligibleForRewards(task)) {
        return { success: false, message: "Escolha uma task com texto para usar o passe." };
      }

      if (currentQuantity <= 0) {
        return { success: false, message: "Voce nao tem Passe Livre disponivel." };
      }

      const { error: inventoryError } = await adjustInventoryItem(
        INVENTORY_ITEM_KEYS.PASS_FREE,
        -1
      );

      if (inventoryError) {
        return { success: false, message: inventoryError.message };
      }

      const reward = await grantTaskCompletionReward(task, {
        countForLootBox: false,
        source: "pass_free",
      });

      if (reward?.error || reward?.skipped) {
        await adjustInventoryItem(INVENTORY_ITEM_KEYS.PASS_FREE, 1);
        return {
          success: false,
          message:
            reward?.error?.message ||
            reward?.message ||
            "Nao foi possivel aplicar o Passe Livre.",
        };
      }

      toggleTask(taskId);
      setTaskRewardMeta(taskId, reward.rewardMeta ?? null);

      showToast({
        title: "Passe Livre usado",
        message: `${task.label} foi concluida sem contar para a loot box.`,
        rarity: "legendary",
      });

      return {
        success: true,
        xp: reward.xp,
        gold: reward.gold,
        rewardMeta: reward.rewardMeta,
      };
    },
    [
      adjustInventoryItem,
      grantTaskCompletionReward,
      setTaskRewardMeta,
      showToast,
      tasks,
      toggleTask,
    ]
  );

  const activateInventoryItem = useCallback(
    async (itemKey, options = {}) => {
      if (itemKey === INVENTORY_ITEM_KEYS.SOCIAL_COUPON) {
        return activateSocialCoupon();
      }

      if (itemKey === INVENTORY_ITEM_KEYS.XP_BOOST) {
        return activateXpBoost();
      }

      if (itemKey === INVENTORY_ITEM_KEYS.PASS_FREE) {
        return activatePassFreeOnTask(options.taskId);
      }

      return { success: false, message: "Item desconhecido na mochila." };
    },
    [activatePassFreeOnTask, activateSocialCoupon, activateXpBoost]
  );

  const rollbackTaskCompletion = useCallback(
    async (rewardMeta) => {
      const currentProfile = profileRef.current;

      if (!currentProfile || !rewardMeta?.rewarded) {
        return { success: true, skipped: true };
      }

      const currentTotalTasksCompleted = Math.max(
        0,
        currentProfile.total_tasks_completed ?? 0
      );
      const nextXp = Math.max(0, currentProfile.xp - rewardMeta.xpGain);
      const snapshot = getLevelSnapshot(nextXp);
      const nextGold = Math.max(0, currentProfile.gold - rewardMeta.goldGain);
      const nextTotalTasksCompleted = Math.max(
        0,
        currentTotalTasksCompleted - (rewardMeta.totalTasksDelta ?? 1)
      );
      const nextBoxProgress = getBoxProgressFromTotal(nextTotalTasksCompleted);

      const { error, data } = await persistProfilePatch({
        xp: nextXp,
        level: snapshot.currentLevel,
        gold: nextGold,
        boxes_count: currentProfile.boxes_count ?? 0,
        box_progress: nextBoxProgress,
        total_tasks_completed: nextTotalTasksCompleted,
        last_box_milestone_claimed:
          currentProfile.last_box_milestone_claimed ?? 0,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        skipped: false,
        xp: rewardMeta.xpGain,
        gold: rewardMeta.goldGain,
        profile: data,
      };
    },
    [persistProfilePatch]
  );

  const openMysteryBox = useCallback(async () => {
    const currentProfile = profileRef.current;

    if (!currentProfile) {
      return {
        error: new Error("Perfil ainda nao foi carregado."),
      };
    }

    if (openingBoxRef.current) {
      return {
        error: new Error("A caixa misteriosa atual ainda esta abrindo."),
      };
    }

    if ((currentProfile.boxes_count ?? 0) <= 0) {
      return {
        error: new Error("Voce nao tem caixas misteriosas disponiveis."),
      };
    }

    openingBoxRef.current = true;
    setIsOpeningBox(true);

    try {
      const reward = rollMysteryReward();
      const isInventoryReward =
        reward.type === INVENTORY_ITEM_KEYS.SOCIAL_COUPON ||
        reward.type === INVENTORY_ITEM_KEYS.PASS_FREE ||
        reward.type === INVENTORY_ITEM_KEYS.XP_BOOST;
      const inventoryDelta = reward.count ?? 1;

      if (isInventoryReward) {
        const { error: inventoryError } = await adjustInventoryItem(
          reward.type,
          inventoryDelta
        );

        if (inventoryError) {
          return { error: inventoryError };
        }
      }

      const partialUpdate = {
        boxes_count: Math.max(0, (currentProfile.boxes_count ?? 0) - 1),
      };

      if (reward.type === "xp") {
        const newXp = currentProfile.xp + reward.xp;
        const snapshot = getLevelSnapshot(newXp);
        const levelBonusGold = getLevelUpGoldBonus(
          currentProfile.level,
          snapshot.currentLevel
        );

        partialUpdate.xp = newXp;
        partialUpdate.level = snapshot.currentLevel;
        partialUpdate.gold = currentProfile.gold + levelBonusGold;
      }

      if (reward.type === "gold") {
        partialUpdate.gold = currentProfile.gold + reward.gold;
      }

      const { error, data } = await persistProfilePatch(partialUpdate);

      if (error) {
        if (isInventoryReward) {
          await adjustInventoryItem(reward.type, -inventoryDelta);
        }
        return { error };
      }

      return {
        error: null,
        reward,
        profile: data,
      };
    } finally {
      openingBoxRef.current = false;
      setIsOpeningBox(false);
    }
  }, [adjustInventoryItem, persistProfilePatch]);

  const triggerMysteryBoxToast = useCallback(
    (reward) => {
      showToast(getRewardToastContent(reward));
    },
    [showToast]
  );

  const boxesCount = profile?.boxes_count ?? 0;
  const boxProgress = profile?.box_progress ?? 0;
  const inventoryCountByKey = getInventoryQuantityMap(inventoryItems);
  const socialCouponCount =
    inventoryCountByKey[INVENTORY_ITEM_KEYS.SOCIAL_COUPON] ?? 0;
  const passFreeCount =
    inventoryCountByKey[INVENTORY_ITEM_KEYS.PASS_FREE] ?? 0;
  const xpBoostCount = inventoryCountByKey[INVENTORY_ITEM_KEYS.XP_BOOST] ?? 0;
  const hasActiveXpMultiplier = isXpMultiplierActive(profile);
  const socialCouponRemainingMs = activeSocialCouponExpiresAt
    ? Math.max(0, new Date(activeSocialCouponExpiresAt).getTime() - Date.now())
    : 0;
  const hasActiveSocialCoupon = socialCouponRemainingMs > 0;
  const onboardingCompleted = Boolean(profile?.onboarding_completed);
  const productivePeriod = profile?.productive_period ?? null;
  const focusArea = profile?.focus_area ?? null;
  const dailyQuestBoard = (dailyQuestState?.available ?? []).map((quest) => ({
    ...quest,
    isActive: dailyQuestState.activeIds.includes(quest.id),
    isCompleted: dailyQuestState.completedIds.includes(quest.id),
    progress: dailyQuestState.progressById[quest.id] ?? 0,
  }));
  const activeDailyQuests = dailyQuestBoard.filter((quest) => quest.isActive);
  const dailyQuestSlotsRemaining = Math.max(
    0,
    MAX_ACTIVE_DAILY_QUESTS - activeDailyQuests.length
  );
  const xpMultiplierRemainingMinutes = hasActiveXpMultiplier
    ? Math.max(
        1,
        Math.ceil(
          (new Date(profile.xp_multiplier_expires_at).getTime() - Date.now()) /
            60000
        )
      )
    : 0;
  const socialCouponRemainingMinutes = hasActiveSocialCoupon
    ? Math.max(1, Math.ceil(socialCouponRemainingMs / 60000))
    : 0;

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        dateStr,
        user,
        profile,
        isLoading,
        toast,
        showToast,
        totalXp,
        addXp,
        removeXp,
        currentLevel,
        xpProgress,
        nextLevelXp,
        xpProgressPercent,
        xpSpent,
        totalGold,
        addGold,
        spendGold,
        executeReward,
        rewardTaskCompletion,
        rollbackTaskCompletion,
        XP_REWARDS,
        boxesCount,
        boxProgress,
        taskProgressTarget: TASK_PROGRESS_TARGET,
        inventoryItems,
        inventoryCountByKey,
        isInventoryLoading,
        socialCouponCount,
        passFreeCount,
        xpBoostCount,
        hasActiveSocialCoupon,
        socialCouponRemainingMinutes,
        activeSocialCouponExpiresAt,
        hasActiveXpMultiplier,
        xpMultiplierRemainingMinutes,
        openMysteryBox,
        isOpeningBox,
        triggerMysteryBoxToast,
        activateInventoryItem,
        activatePassFreeOnTask,
        isTaskEligibleForRewards,
        onboardingCompleted,
        productivePeriod,
        focusArea,
        completeOnboarding,
        isSavingOnboarding,
        productivePeriodOptions: PRODUCTIVE_PERIOD_OPTIONS,
        focusAreaOptions: FOCUS_AREA_OPTIONS,
        generateDailyQuests,
        dailyQuestBoard,
        activeDailyQuests,
        activateDailyQuest,
        dailyQuestSlotsRemaining,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
