import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ApplicationReadySnapshot } from "./deriveApplicationReady";

const IDLE: ApplicationReadySnapshot = {
  state: "NOT_STARTED",
  isReady: false,
  isAuthRequired: false,
  isFailed: false,
  isBootstrapping: true,
  bootstrap: null,
  identityUserId: null,
};

export const ReadyContext = createContext<ApplicationReadySnapshot>(IDLE);

export function ReadyContextProvider({
  value,
  children,
}: {
  value: ApplicationReadySnapshot;
  children: ReactNode;
}) {
  return (
    <ReadyContext.Provider value={value}>{children}</ReadyContext.Provider>
  );
}

export function useReadyContext(): ApplicationReadySnapshot {
  return useContext(ReadyContext);
}
