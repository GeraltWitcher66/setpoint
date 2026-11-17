export type ISODate = string;
export type ISODateTime = string;

/** 0 = یکشنبه … 6 = شنبه (مطابق Date.getDay) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CourtSurface = "hard" | "clay" | "artificial";
export type CourtEnvironment = "indoor" | "outdoor";
export type CourtStatus = "active" | "maintenance";

export interface Court {
  id: string;
  name: string;
  surface: CourtSurface;
  environment: CourtEnvironment;
  hasLights: boolean;
  basePricePerHour: number;
  peakPricePerHour: number;
  image: string;
  amenities: string[];
  status: CourtStatus;
  sortOrder: number;
  description: string;
}

export type CoachLevel = "beginner" | "intermediate" | "advanced" | "pro";

export interface CoachWeeklyHour {
  weekday: Weekday;
  startTime: string;
  endTime: string;
}

export interface CoachTimeOff {
  id: string;
  from: ISODate;
  to: ISODate;
  reason: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: CoachLevel;
  bio: string;
  pricePerSession: number;
  sessionMinutes: number;
  avatar: string;
  specialties: string[];
  weeklyHours: CoachWeeklyHour[];
  timeOff: CoachTimeOff[];
  active: boolean;
}

export type EquipmentCategory = "racket" | "ball" | "machine" | "accessory";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  pricePerSession: number;
  stock: number;
  unitLabel: string;
  description: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  sessions: number;
  validityDays: number;
  price: number;
  discountPercent: number;
  popular: boolean;
}

export type ClassLevel = "beginner" | "intermediate" | "advanced";

export interface GroupClass {
  id: string;
  name: string;
  description: string;
  coachId: string;
  weekdays: Weekday[];
  startTime: string;
  durationMinutes: number;
  capacity: number;
  pricePerSession: number;
  level: ClassLevel;
  enrolledCustomerIds: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  joinedAt: ISODate;
  credit: number;
  notes: string;
  blocked: boolean;
  blockedReason: string | null;
}

export type BookingStatus =
  | "confirmed"
  | "completed"
  | "no-show"
  | "cancelled"
  | "blocked";

export type BookingSource = "online" | "walk-in" | "phone" | "admin";
export type PaymentMethod = "online" | "cash" | "package";
export type BlockReason = "maintenance" | "tournament" | "rain" | "other";
export type CancellationPolicy = "free" | "late" | "rain" | "admin";

export interface BookedEquipment {
  equipmentId: string;
  quantity: number;
  pickedUp: boolean;
  returned: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  customerId: string | null;
  customerName: string;
  date: ISODate;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  source: BookingSource;
  coachId: string | null;
  equipment: BookedEquipment[];
  packageId: string | null;
  blockReason: BlockReason | null;
  notes: string;
  subtotal: number;
  coachTotal: number;
  equipmentTotal: number;
  discount: number;
  total: number;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
  confirmationCode: string;
  reviewed: boolean;
  createdAt: ISODateTime;
  cancelledAt: ISODateTime | null;
  cancellationPolicy: CancellationPolicy | null;
}

export type WaitlistStatus = "waiting" | "offered" | "converted" | "expired";

export interface WaitlistEntry {
  id: string;
  courtId: string;
  customerId: string;
  customerName: string;
  date: ISODate;
  startTime: string;
  endTime: string;
  status: WaitlistStatus;
  createdAt: ISODateTime;
  note: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  courtId: string;
  coachId: string | null;
  rating: number;
  comment: string;
  createdAt: ISODateTime;
}

export interface PricingRule {
  id: string;
  name: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  multiplier: number;
  active: boolean;
}

export interface Holiday {
  id: string;
  date: ISODate;
  name: string;
  closed: boolean;
}

export interface CustomerPackage {
  id: string;
  customerId: string;
  packageId: string;
  purchasedAt: ISODate;
  sessionsTotal: number;
  sessionsUsed: number;
  expiresAt: ISODate;
}

export interface StudentNote {
  id: string;
  coachId: string;
  customerId: string;
  note: string;
  date: ISODate;
}
