"use client";

import { useSyncExternalStore } from "react";

export type UserRole = "customer" | "admin" | "coach";

export interface Session {
  role: UserRole;
  name: string;
  customerId?: string;
  coachId?: string;
}

const SESSION_KEY = "setpoint.v1.session";
const listeners = new Set<() => void>();
let cached: Session | null | undefined;

function emit() {
  for (const listener of listeners) listener();
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  if (cached !== undefined) return cached;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    cached = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cached = null;
  }

  return cached;
}

export function setSession(session: Session | null) {
  cached = session;

  if (typeof window !== "undefined") {
    try {
      if (session) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Storage can be unavailable; keep the in-memory session.
    }
  }

  emit();
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    readSession,
    () => null,
  );
}

if (typeof window !== "undefined") {
  const flag = "__setpointSessionListenerBound";
  const globalWindow = window as unknown as Record<string, boolean>;

  if (!globalWindow[flag]) {
    globalWindow[flag] = true;
    window.addEventListener("storage", (event) => {
      if (event.key === SESSION_KEY) {
        cached = undefined;
        emit();
      }
    });
  }
}
