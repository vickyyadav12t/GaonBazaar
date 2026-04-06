import { createContext, useContext } from 'react';

export type AdminDashboardModel = Record<string, unknown>;

const AdminDashboardContext = createContext<AdminDashboardModel | null>(null);

export function AdminDashboardProvider({
  value,
  children,
}: {
  value: AdminDashboardModel;
  children: React.ReactNode;
}) {
  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>;
}

export function useAdminDashboard(): AdminDashboardModel {
  const v = useContext(AdminDashboardContext);
  if (v == null) {
    throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  }
  return v;
}
