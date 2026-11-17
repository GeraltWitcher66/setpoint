import {
  getDatabase,
  resetDatabase,
  subscribeToDatabase,
  updateDatabase,
} from "@/lib/mock/db";
import type {
  Booking,
  BookingStatus,
  Coach,
  Court,
  Customer,
  Equipment,
  GroupClass,
  Holiday,
  ISODate,
  Package,
  PricingRule,
  Review,
  WaitlistEntry,
} from "@/lib/types";

export { DB_STORAGE_KEY } from "@/lib/mock/db";
export { resetDatabase, subscribeToDatabase };

export function getCourts(): Court[] {
  return [...getDatabase().courts].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCoaches(): Coach[] {
  return getDatabase().coaches.filter((coach) => coach.active);
}

export function getEquipment(): Equipment[] {
  return getDatabase().equipment;
}

export function getPackages(): Package[] {
  return getDatabase().packages;
}

export function getGroupClasses(): GroupClass[] {
  return getDatabase().groupClasses;
}

export function getPricingRules(): PricingRule[] {
  return getDatabase().pricingRules;
}

export function getHolidays(): Holiday[] {
  return getDatabase().holidays;
}

export function getCustomers(): Customer[] {
  return getDatabase().customers;
}

export function getCustomerById(id: string): Customer | undefined {
  return getDatabase().customers.find((customer) => customer.id === id);
}

export function findCustomerByPhone(phone: string): Customer | undefined {
  const normalized = phone.replace(/\D/g, "");
  return getDatabase().customers.find(
    (customer) => customer.phone.replace(/\D/g, "") === normalized,
  );
}

export function getDemoCustomer(): Customer {
  return getDatabase().customers[0];
}

export function getCoachByEmail(email: string): Coach | undefined {
  return getDatabase().coaches.find(
    (coach) => coach.email.toLowerCase() === email.toLowerCase(),
  );
}

export function getCoachById(id: string): Coach | undefined {
  return getDatabase().coaches.find((coach) => coach.id === id);
}

export function getCourtById(id: string): Court | undefined {
  return getDatabase().courts.find((court) => court.id === id);
}

export function getPackageById(id: string): Package | undefined {
  return getDatabase().packages.find((pkg) => pkg.id === id);
}

export interface BookingFilter {
  courtId?: string;
  customerId?: string;
  coachId?: string;
  from?: ISODate;
  to?: ISODate;
  status?: BookingStatus[];
}

export function getBookings(filter: BookingFilter = {}): Booking[] {
  return getDatabase()
    .bookings.filter((booking) => {
      if (filter.courtId && booking.courtId !== filter.courtId) return false;
      if (filter.customerId && booking.customerId !== filter.customerId) return false;
      if (filter.coachId && booking.coachId !== filter.coachId) return false;
      if (filter.from && booking.date < filter.from) return false;
      if (filter.to && booking.date > filter.to) return false;
      if (filter.status && !filter.status.includes(booking.status)) return false;
      return true;
    })
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    );
}

export function getBookingById(id: string): Booking | undefined {
  return getDatabase().bookings.find((booking) => booking.id === id);
}

export function saveBooking(booking: Booking): Booking {
  return updateDatabase((db) => {
    const index = db.bookings.findIndex((item) => item.id === booking.id);
    if (index >= 0) db.bookings[index] = booking;
    else db.bookings.push(booking);
    return booking;
  });
}

export function patchBooking(
  id: string,
  patch: Partial<Booking>,
): Booking | null {
  return updateDatabase((db) => {
    const booking = db.bookings.find((item) => item.id === id);
    if (!booking) return null;
    Object.assign(booking, patch);
    return booking;
  });
}

export function patchCustomer(
  id: string,
  patch: Partial<Customer>,
): Customer | null {
  return updateDatabase((db) => {
    const customer = db.customers.find((item) => item.id === id);
    if (!customer) return null;
    Object.assign(customer, patch);
    return customer;
  });
}

export function patchEquipment(
  id: string,
  patch: Partial<Equipment>,
): Equipment | null {
  return updateDatabase((db) => {
    const item = db.equipment.find((equipmentItem) => equipmentItem.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    return item;
  });
}

export function getReviews(limit?: number): Review[] {
  const reviews = [...getDatabase().reviews].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return typeof limit === "number" ? reviews.slice(0, limit) : reviews;
}

export function addReview(review: Review): Review {
  return updateDatabase((db) => {
    db.reviews.unshift(review);
    const booking = db.bookings.find((item) => item.id === review.bookingId);
    if (booking) booking.reviewed = true;
    return review;
  });
}

export function getWaitlist(limit?: number): WaitlistEntry[] {
  const entries = [...getDatabase().waitlist].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
}

export function addWaitlistEntry(entry: WaitlistEntry): WaitlistEntry {
  return updateDatabase((db) => {
    db.waitlist.unshift(entry);
    return entry;
  });
}

export function patchWaitlistEntry(
  id: string,
  patch: Partial<WaitlistEntry>,
): WaitlistEntry | null {
  return updateDatabase((db) => {
    const entry = db.waitlist.find((item) => item.id === id);
    if (!entry) return null;
    Object.assign(entry, patch);
    return entry;
  });
}
