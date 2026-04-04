export const PRODUCTIVE_PERIOD_OPTIONS = [
  {
    value: "morning",
    label: "Manha",
    description: "Quero quests que empurrem meu pico logo cedo.",
  },
  {
    value: "night",
    label: "Noite",
    description: "Rendo melhor mais tarde e prefiro quests noturnas.",
  },
  {
    value: "flexible",
    label: "Flexivel",
    description: "Quero uma mistura equilibrada de horarios.",
  },
];

export const FOCUS_AREA_OPTIONS = [
  {
    value: "studies",
    label: "Estudos",
    description: "Missoes mais puxadas para aprendizado e consistencia.",
  },
  {
    value: "work",
    label: "Trabalho",
    description: "Quests com cara de execucao, entrega e rotina profissional.",
  },
  {
    value: "general",
    label: "Geral",
    description: "Um mix amplo para manter ritmo em qualquer area.",
  },
];

export const DAILY_QUEST_TEMPLATES = [
  {
    templateId: "study_sprint_25",
    title: "Sprint de Estudos",
    description: "Conclua 2 tasks para manter o cerebro em aquecimento.",
    metric: "completed_tasks",
    target: 2,
    xpReward: 45,
    goldReward: 20,
    iconKey: "study",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "general"],
  },
  {
    templateId: "work_sprint_3",
    title: "Sprint de Trabalho",
    description: "Complete 3 tasks e destrave uma recompensa extra.",
    metric: "completed_tasks",
    target: 3,
    xpReward: 60,
    goldReward: 30,
    iconKey: "work",
    periods: ["morning", "flexible", "night"],
    focuses: ["work", "general"],
  },
  {
    templateId: "general_three_tasks",
    title: "Combo de Execucao",
    description: "Complete 3 tasks validas no seu plano do dia.",
    metric: "completed_tasks",
    target: 3,
    xpReward: 55,
    goldReward: 25,
    iconKey: "tasks",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "general_five_tasks",
    title: "Modo Imparavel",
    description: "Feche 5 tasks para ganhar um bonus maior.",
    metric: "completed_tasks",
    target: 5,
    xpReward: 110,
    goldReward: 55,
    iconKey: "flame",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "morning_first_hit",
    title: "Primeiro Hit da Manha",
    description: "Conclua 1 task antes das 09:00.",
    metric: "morning_tasks_early",
    target: 1,
    xpReward: 35,
    goldReward: 15,
    iconKey: "sun",
    periods: ["morning", "flexible"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "morning_double",
    title: "Janela de Ouro",
    description: "Conclua 2 tasks antes das 12:00.",
    metric: "morning_tasks",
    target: 2,
    xpReward: 70,
    goldReward: 35,
    iconKey: "sun",
    periods: ["morning", "flexible"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "night_first_hit",
    title: "Aquecimento Noturno",
    description: "Conclua 1 task depois das 18:00.",
    metric: "night_tasks",
    target: 1,
    xpReward: 35,
    goldReward: 15,
    iconKey: "moon",
    periods: ["night", "flexible"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "night_double",
    title: "Fechamento de Arena",
    description: "Conclua 2 tasks depois das 18:00.",
    metric: "night_tasks",
    target: 2,
    xpReward: 70,
    goldReward: 35,
    iconKey: "moon",
    periods: ["night", "flexible"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "register_any_transaction",
    title: "Radar Financeiro",
    description: "Registre pelo menos 1 transacao hoje.",
    metric: "today_transactions",
    target: 1,
    xpReward: 30,
    goldReward: 15,
    iconKey: "wallet",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "register_expense",
    title: "Controle de Gasto",
    description: "Lance 1 despesa para manter o caixa em dia.",
    metric: "today_expenses",
    target: 1,
    xpReward: 35,
    goldReward: 18,
    iconKey: "expense",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "register_income",
    title: "Entrada Confirmada",
    description: "Registre 1 receita no painel financeiro.",
    metric: "today_income",
    target: 1,
    xpReward: 40,
    goldReward: 20,
    iconKey: "income",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
  {
    templateId: "positive_balance",
    title: "Saldo no Verde",
    description: "Feche o dia com saldo financeiro positivo.",
    metric: "positive_balance",
    target: 1,
    xpReward: 45,
    goldReward: 25,
    iconKey: "balance",
    periods: ["morning", "flexible", "night"],
    focuses: ["studies", "work", "general"],
  },
];

const normalizeTaskLabel = (task) =>
  task?.label?.replace(/\s+/g, " ").trim() ?? "";

const isTaskEligible = (task) => normalizeTaskLabel(task).length > 0;

const countCompletedTasks = (tasks, predicate = () => true) =>
  tasks.filter(
    (task) => task.done && isTaskEligible(task) && predicate(task)
  ).length;

const isMorningTask = (task) => (task?.time ?? "99:99") < "12:00";
const isEarlyMorningTask = (task) => (task?.time ?? "99:99") < "09:00";
const isNightTask = (task) => (task?.time ?? "00:00") >= "18:00";

export const getTodayKey = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const shuffle = (items) => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
};

const isTemplateCompatible = (template, profile) => {
  const productivePeriod = profile?.productive_period ?? "flexible";
  const focusArea = profile?.focus_area ?? "general";

  const periodAllowed = template.periods.includes(productivePeriod);
  const focusAllowed = template.focuses.includes(focusArea);

  return periodAllowed && focusAllowed;
};

export function generateDailyQuests(profile, options = {}) {
  const { limit = 5, dateKey = getTodayKey() } = options;
  const productivePeriod = profile?.productive_period ?? "flexible";
  const periodPool = DAILY_QUEST_TEMPLATES.filter((template) =>
    template.periods.includes(productivePeriod)
  );
  const preferredPool = periodPool.filter((template) =>
    isTemplateCompatible(template, profile)
  );
  const fallbackPool =
    preferredPool.length >= limit
      ? preferredPool
      : periodPool.length >= limit
        ? periodPool
        : DAILY_QUEST_TEMPLATES;

  return shuffle(fallbackPool)
    .slice(0, limit)
    .map((template) => ({
      ...template,
      id: `${dateKey}:${template.templateId}`,
      dateKey,
    }));
}

export function evaluateQuestProgress(quest, snapshot) {
  const tasks = snapshot?.tasks ?? [];
  const transactions = snapshot?.transactions ?? [];
  const summary = snapshot?.summary ?? {};
  const todayKey = snapshot?.todayKey ?? getTodayKey();
  const todayTransactions = transactions.filter(
    (transaction) => transaction?.date === todayKey
  );

  let progress = 0;

  switch (quest.metric) {
    case "completed_tasks":
      progress = countCompletedTasks(tasks);
      break;
    case "morning_tasks_early":
      progress = countCompletedTasks(tasks, isEarlyMorningTask);
      break;
    case "morning_tasks":
      progress = countCompletedTasks(tasks, isMorningTask);
      break;
    case "night_tasks":
      progress = countCompletedTasks(tasks, isNightTask);
      break;
    case "today_transactions":
      progress = todayTransactions.length;
      break;
    case "today_expenses":
      progress = todayTransactions.filter(
        (transaction) => transaction.type === "expense"
      ).length;
      break;
    case "today_income":
      progress = todayTransactions.filter(
        (transaction) => transaction.type === "income"
      ).length;
      break;
    case "positive_balance":
      progress = (summary.balance ?? 0) >= 0 ? 1 : 0;
      break;
    default:
      progress = 0;
      break;
  }

  const normalizedProgress = Math.min(progress, quest.target);

  return {
    progress: normalizedProgress,
    completed: normalizedProgress >= quest.target,
  };
}
