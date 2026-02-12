import React, { createContext, useContext, useState } from 'react';

export interface NavPillData {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  count: number;
  label: string;
  navigateTo: string;
  color: string;
  isActive: boolean;
}

interface NavContextValue {
  pills: NavPillData[];
  setPills: (pills: NavPillData[]) => void;
  actions: React.ReactNode | null;
  setActions: (actions: React.ReactNode | null) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [pills, setPills] = useState<NavPillData[]>([]);
  const [actions, setActions] = useState<React.ReactNode | null>(null);

  return (
    <NavContext.Provider value={{ pills, setPills, actions, setActions }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return ctx;
}
