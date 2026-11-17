"use client";

import { useSyncExternalStore } from "react";
import { getDatabase, subscribeToDatabase, type MockDatabase } from "@/lib/mock/db";

export function useDatabase(): MockDatabase {
  return useSyncExternalStore(
    subscribeToDatabase,
    getDatabase,
    getDatabase,
  );
}
