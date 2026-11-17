import type {
  Booking,
  Coach,
  Court,
  Customer,
  CustomerPackage,
  Equipment,
  GroupClass,
  Holiday,
  Package,
  PricingRule,
  Review,
  StudentNote,
  WaitlistEntry,
} from "@/lib/types";
import { todayISO } from "./date-utils";
import { createSeedDatabase, SEED_VERSION } from "./seed";

export interface MockDatabase {
  version: number;
  seededFor: string;
  seededAt: string;
  courts: Court[];
  coaches: Coach[];
  equipment: Equipment[];
  packages: Package[];
  groupClasses: GroupClass[];
  customers: Customer[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  reviews: Review[];
  pricingRules: PricingRule[];
  holidays: Holiday[];
  customerPackages: CustomerPackage[];
  studentNotes: StudentNote[];
}

export const DB_STORAGE_KEY = "setpoint.v1.db";

const listeners = new Set<() => void>();
let memoryDatabase: MockDatabase | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function writeDatabase(database: MockDatabase, notify = true) {
  memoryDatabase = database;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(database));
    } catch {
      // Storage can be full or blocked; the in-memory copy still works.
    }
  }

  if (notify) emit();
}

function readStoredDatabase(): MockDatabase | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<MockDatabase>;

    // The demo is always seeded for the current day so the calendar stays fresh.
    if (
      parsed.version !== SEED_VERSION ||
      parsed.seededFor !== todayISO() ||
      !Array.isArray(parsed.bookings) ||
      !Array.isArray(parsed.courts)
    ) {
      return null;
    }

    return parsed as MockDatabase;
  } catch {
    return null;
  }
}

export function getDatabase(): MockDatabase {
  if (memoryDatabase) return memoryDatabase;

  const stored = readStoredDatabase();
  if (stored) {
    memoryDatabase = stored;
    return stored;
  }

  const seeded = createSeedDatabase();
  writeDatabase(seeded, false);
  return seeded;
}

/**
 * Applies a change to a cloned snapshot so React subscribers see a new object.
 */
export function updateDatabase<T>(mutator: (draft: MockDatabase) => T): T {
  const draft = structuredClone(getDatabase());
  const result = mutator(draft);
  writeDatabase(draft);
  return result;
}

export function resetDatabase(): MockDatabase {
  memoryDatabase = null;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(DB_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  const seeded = createSeedDatabase();
  writeDatabase(seeded);
  return seeded;
}

export function subscribeToDatabase(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  const flag = "__setpointStorageListenerBound";
  const globalWindow = window as unknown as Record<string, boolean>;

  if (!globalWindow[flag]) {
    globalWindow[flag] = true;
    window.addEventListener("storage", (event) => {
      if (event.key === DB_STORAGE_KEY) {
        memoryDatabase = null;
        emit();
      }
    });
  }
}
