import { createContext, useState } from "react";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [view, setView] = useState("dashboard");
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppContext.Provider value={{ view, setView, dateStr }}>
      {children}
    </AppContext.Provider>
  );
}
