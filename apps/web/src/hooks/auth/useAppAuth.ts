import { createContext, useContext } from "react";
import type { User } from "@privy-io/react-auth";

export type GetAccessToken = () => Promise<string | null>;
export type LinkTelegram = (options?: {
  launchParams: {
    initDataRaw?: string;
  };
}) => void;

export interface AppAuthState {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  getAccessToken: GetAccessToken | null;
  linkTelegram: LinkTelegram | null;
}

export const APP_AUTH_DEFAULT_STATE: AppAuthState = {
  enabled: false,
  ready: true,
  authenticated: false,
  user: null,
  getAccessToken: null,
  linkTelegram: null,
};

export const AppAuthContext = createContext<AppAuthState>(
  APP_AUTH_DEFAULT_STATE,
);

export function useAppAuth() {
  return useContext(AppAuthContext);
}
