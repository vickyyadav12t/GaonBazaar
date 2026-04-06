import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CopilotContextPayload } from '@/types';

type CopilotCtx = {
  copilotContext: CopilotContextPayload | null;
  setCopilotContext: (next: CopilotContextPayload | null) => void;
};

const CopilotReactContext = createContext<CopilotCtx | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [copilotContext, setCopilotContext] = useState<CopilotContextPayload | null>(null);
  const value = useMemo(
    () => ({ copilotContext, setCopilotContext }),
    [copilotContext]
  );
  return (
    <CopilotReactContext.Provider value={value}>{children}</CopilotReactContext.Provider>
  );
}

export function useCopilot() {
  const c = useContext(CopilotReactContext);
  if (!c) {
    throw new Error('useCopilot must be used within CopilotProvider');
  }
  return c;
}
