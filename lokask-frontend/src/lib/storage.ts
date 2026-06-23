const STORAGE_ENGINE = window.sessionStorage; 

export const AuthStorage = {
  getToken: (): string | null => STORAGE_ENGINE.getItem("token"),
  setToken: (token: string): void => STORAGE_ENGINE.setItem("token", token),

  getUser: <T = any>(): T | null => {
    const userStr = STORAGE_ENGINE.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as T;
    } catch (e) {
      console.error("Failed to parse user from storage", e);
      return null;
    }
  },
  setUser: (user: any): void => STORAGE_ENGINE.setItem("user", JSON.stringify(user)),

  getDashboardSection: (): string => {
    return STORAGE_ENGINE.getItem("dashboard_active_section") || "inbox";
  },
  setDashboardSection: (section: string): void => {
    STORAGE_ENGINE.setItem("dashboard_active_section", section);
  },

  clearAll: (): void => {
    STORAGE_ENGINE.removeItem("token");
    STORAGE_ENGINE.removeItem("user");
    STORAGE_ENGINE.removeItem("dashboard_active_section");
  }
};