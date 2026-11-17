import { siteConfig } from "@/config/site";
import type {
  Booking,
  BookedEquipment,
  Coach,
  Court,
  Customer,
  CustomerPackage,
  Equipment,
  GroupClass,
  Holiday,
  Package,
  PaymentMethod,
  PricingRule,
  Review,
  StudentNote,
  WaitlistEntry,
} from "@/lib/types";
import type { MockDatabase } from "./db";
import {
  addDays,
  minutesToTime,
  timeToMinutes,
  toISODate,
  weekdayOf,
} from "./date-utils";

export const SEED_VERSION = 2;

const courts: Court[] = [
  {
    id: "court-1",
    name: "زمین ۱ — هارد سرپوشیده",
    surface: "hard",
    environment: "indoor",
    hasLights: true,
    basePricePerHour: 480_000,
    peakPricePerHour: 600_000,
    image: "/images/courts/court-1.jpg",
    amenities: ["سرپوشیده", "روشنایی", "جایگاه تماشاگر", "رختکن"],
    status: "active",
    sortOrder: 1,
    description: "زمین استاندارد هارد با پوشش کامل، مناسب بازی در تمام فصل‌ها.",
  },
  {
    id: "court-2",
    name: "زمین ۲ — هارد سرپوشیده",
    surface: "hard",
    environment: "indoor",
    hasLights: true,
    basePricePerHour: 480_000,
    peakPricePerHour: 600_000,
    image: "/images/courts/court-2.jpg",
    amenities: ["سرپوشیده", "روشنایی", "رختکن", "آب‌سردکن"],
    status: "active",
    sortOrder: 2,
    description: "زمین سرپوشیدهٔ دوم با کف تازه‌بازسازی‌شده و فضای تمرین اختصاصی.",
  },
  {
    id: "court-3",
    name: "زمین ۳ — هارد روباز",
    surface: "hard",
    environment: "outdoor",
    hasLights: true,
    basePricePerHour: 380_000,
    peakPricePerHour: 500_000,
    image: "/images/courts/court-3.jpg",
    amenities: ["روشنایی شب", "رختکن", "پارکینگ"],
    status: "active",
    sortOrder: 3,
    description: "زمین روباز با نورافکن، انتخاب محبوب برای بازی‌های عصر و شب.",
  },
  {
    id: "court-4",
    name: "زمین ۴ — خاک رس روباز",
    surface: "clay",
    environment: "outdoor",
    hasLights: false,
    basePricePerHour: 420_000,
    peakPricePerHour: 540_000,
    image: "/images/courts/court-4.jpg",
    amenities: ["خاک رس", "آبیاری خودکار", "رختکن"],
    status: "active",
    sortOrder: 4,
    description: "زمین خاکی با سطوح نرم‌تر، مناسب تمرین تکنیک و بازی طولانی.",
  },
];

const equipment: Equipment[] = [
  {
    id: "eq-racket-pro",
    name: "راکت حرفه‌ای",
    category: "racket",
    pricePerSession: 50_000,
    stock: 4,
    unitLabel: "عدد",
    description: "راکت سبک با تعادل حرفه‌ای برای بازیکنان متوسط و پیشرفته.",
  },
  {
    id: "eq-racket-beginner",
    name: "راکت مبتدی",
    category: "racket",
    pricePerSession: 30_000,
    stock: 8,
    unitLabel: "عدد",
    description: "راکت با سطح بزرگ و کنترل آسان برای شروع.",
  },
  {
    id: "eq-balls",
    name: "قوطی توپ",
    category: "ball",
    pricePerSession: 25_000,
    stock: 20,
    unitLabel: "قوطی",
    description: "سه توپ نو با فشار استاندارد.",
  },
  {
    id: "eq-ball-machine",
    name: "دستگاه توپ‌انداز",
    category: "machine",
    pricePerSession: 350_000,
    stock: 1,
    unitLabel: "دستگاه",
    description: "دستگاه تنظیم سرعت و زاویه برای تمرین تک‌نفره.",
  },
  {
    id: "eq-ball-basket",
    name: "سبد توپ تمرینی",
    category: "ball",
    pricePerSession: 60_000,
    stock: 5,
    unitLabel: "سبد",
    description: "سبد ۶۰ توپی برای تمرین سرویس و دریل.",
  },
  {
    id: "eq-towel",
    name: "حوله",
    category: "accessory",
    pricePerSession: 10_000,
    stock: 15,
    unitLabel: "عدد",
    description: "حولهٔ تمیز باشگاه، تحویل در پذیرش.",
  },
  {
    id: "eq-grip",
    name: "گریپ راکت",
    category: "accessory",
    pricePerSession: 8_000,
    stock: 40,
    unitLabel: "عدد",
    description: "گریپ نو برای افزایش چسبندگی دسته.",
  },
  {
    id: "eq-racket-bag",
    name: "کیف راکت",
    category: "accessory",
    pricePerSession: 15_000,
    stock: 10,
    unitLabel: "عدد",
    description: "کیف تک‌راکت با بند شانه.",
  },
];

const packages: Package[] = [
  {
    id: "pkg-10",
    name: "پکیج ۱۰ جلسه‌ای",
    description: "ده ساعت رزرو زمین با تخفیف، قابل استفاده در همهٔ زمین‌ها.",
    sessions: 10,
    validityDays: 90,
    price: 4_200_000,
    discountPercent: 8,
    popular: true,
  },
  {
    id: "pkg-morning-5",
    name: "پکیج صبحگاهی ۵ جلسه",
    description: "پنج جلسهٔ صبحگاهی (تا ساعت ۱۲) با قیمت ویژه.",
    sessions: 5,
    validityDays: 60,
    price: 1_650_000,
    discountPercent: 5,
    popular: false,
  },
];

const groupClasses: GroupClass[] = [
  {
    id: "class-adult-beginner",
    name: "مقدماتی بزرگسالان",
    description: "آموزش پایه‌های فورهند، بک‌هند و سرویس در گروه‌های کوچک.",
    coachId: "coach-3",
    weekdays: [6, 1],
    startTime: "18:00",
    durationMinutes: 90,
    capacity: 8,
    pricePerSession: 320_000,
    level: "beginner",
    enrolledCustomerIds: ["customer-demo", "customer-2", "customer-5", "customer-7"],
  },
  {
    id: "class-junior",
    name: "آکادمی نوجوانان",
    description: "کلاس شاد و بازی‌محور برای نوجوان‌های ۸ تا ۱۴ سال.",
    coachId: "coach-4",
    weekdays: [6, 3],
    startTime: "16:00",
    durationMinutes: 60,
    capacity: 10,
    pricePerSession: 240_000,
    level: "beginner",
    enrolledCustomerIds: ["customer-3", "customer-6", "customer-9", "customer-11"],
  },
  {
    id: "class-advanced",
    name: "کلاس پیشرفته",
    description: "تمرین تاکتیک، الگوی بازی و آماده‌سازی مسابقه.",
    coachId: "coach-1",
    weekdays: [0, 2],
    startTime: "19:00",
    durationMinutes: 90,
    capacity: 6,
    pricePerSession: 450_000,
    level: "advanced",
    enrolledCustomerIds: ["customer-4", "customer-8", "customer-10"],
  },
];

const slotStarts = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const reviewComments = [
  "زمین‌ها خیلی تمیز بودند و رزرو دقیق سر وقت شروع شد.",
  "مربی عالی بود؛ توی یک جلسه سرویسم بهتر شد.",
  "نورپردازی زمین روباز شب حرف نداشت.",
  "کاش رختکن بزرگ‌تر بود، ولی بقیهٔ چیزها خوب بود.",
  "توپ و راکت تحویل گرفتم، کیفیتشان خوب بود.",
  "فرایند رزرو خیلی ساده بود؛ دو دقیقه‌ای انجام شد.",
  "زمین خاکی عالیه، فقط بعد از باران کمی خیس بود.",
  "کلاس گروهی نوجوان‌ها را پسرم خیلی دوست داشت.",
  "پارکینگ راحت پیدا شد و پذیرش خوش‌برخورد بود.",
  "یه سانس را لغو کردم و اعتبارش سریع برگشت.",
];

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCoaches(today: string): Coach[] {
  return [
    {
      id: "coach-1",
      name: "آرش رضایی",
      email: "coach@demo.test",
      phone: "۰۹۱۲۱۲۳۴۵۶۷",
      level: "pro",
      bio: "بازیکن سابق تور ملی و مربی با ۱۲ سال تجربهٔ آماده‌سازی مسابقه.",
      pricePerSession: 850_000,
      sessionMinutes: 60,
      avatar: "/images/coaches/coach-1.jpg",
      specialties: ["تکنیک فورهند", "سرویس", "آماده‌سازی مسابقه"],
      weeklyHours: [
        { weekday: 6, startTime: "16:00", endTime: "21:00" },
        { weekday: 0, startTime: "16:00", endTime: "21:00" },
        { weekday: 1, startTime: "16:00", endTime: "21:00" },
        { weekday: 2, startTime: "16:00", endTime: "21:00" },
        { weekday: 3, startTime: "16:00", endTime: "21:00" },
      ],
      timeOff: [
        {
          id: "coach-1-timeoff-1",
          from: addDays(today, 5),
          to: addDays(today, 7),
          reason: "سفر مسابقات",
        },
      ],
      active: true,
    },
    {
      id: "coach-2",
      name: "مریم کاظمی",
      email: "maryam@demo.test",
      phone: "۰۹۱۲۲۲۳۴۵۶۷",
      level: "advanced",
      bio: "مربی تخصصی بک‌هند و بازی پایه با نگاه فنی به جزئیات.",
      pricePerSession: 700_000,
      sessionMinutes: 60,
      avatar: "/images/coaches/coach-2.jpg",
      specialties: ["بک‌هند دو دست", "بازی پایه", "حرکت پا"],
      weeklyHours: [
        { weekday: 6, startTime: "09:00", endTime: "13:00" },
        { weekday: 1, startTime: "09:00", endTime: "13:00" },
        { weekday: 3, startTime: "09:00", endTime: "13:00" },
        { weekday: 0, startTime: "17:00", endTime: "20:00" },
        { weekday: 2, startTime: "17:00", endTime: "20:00" },
      ],
      timeOff: [
        {
          id: "coach-2-timeoff-1",
          from: addDays(today, 11),
          to: addDays(today, 12),
          reason: "مرخصی شخصی",
        },
      ],
      active: true,
    },
    {
      id: "coach-3",
      name: "سینا فرهادی",
      email: "sina@demo.test",
      phone: "۰۹۱۲۳۳۴۵۶۷۸",
      level: "intermediate",
      bio: "مربی صبور برای شروع تنیس و اصلاح فرم؛ عاشق کلاس‌های گروهی.",
      pricePerSession: 550_000,
      sessionMinutes: 60,
      avatar: "/images/coaches/coach-3.jpg",
      specialties: ["تنیس مبتدی", "اصلاح فرم", "کلاس گروهی"],
      weeklyHours: [
        { weekday: 0, startTime: "17:00", endTime: "21:00" },
        { weekday: 1, startTime: "17:00", endTime: "21:00" },
        { weekday: 2, startTime: "17:00", endTime: "21:00" },
        { weekday: 3, startTime: "17:00", endTime: "21:00" },
        { weekday: 4, startTime: "17:00", endTime: "21:00" },
      ],
      timeOff: [],
      active: true,
    },
    {
      id: "coach-4",
      name: "نگار موسوی",
      email: "negar@demo.test",
      phone: "۰۹۱۲۴۴۵۶۷۸۹",
      level: "beginner",
      bio: "مسئول آکادمی نوجوانان؛ تمرین‌های بازی‌محور و امن برای بچه‌ها.",
      pricePerSession: 480_000,
      sessionMinutes: 60,
      avatar: "/images/coaches/coach-4.jpg",
      specialties: ["آکادمی نوجوانان", "بازی شاد", "هماهنگی"],
      weeklyHours: [
        { weekday: 4, startTime: "15:00", endTime: "19:00" },
        { weekday: 5, startTime: "15:00", endTime: "19:00" },
        { weekday: 6, startTime: "15:00", endTime: "19:00" },
      ],
      timeOff: [],
      active: true,
    },
  ];
}

function buildCustomers(today: string): Customer[] {
  const seeds: Array<{
    name: string;
    phone: string;
    email: string | null;
    credit: number;
    notes: string;
    blocked?: boolean;
    blockedReason?: string | null;
    joinedOffset: number;
  }> = [
    {
      name: "سارا احمدی",
      phone: "09120000000",
      email: "sara@demo.test",
      credit: 1_200_000,
      notes: "علاقه‌مند به کلاس گروهی؛ ترجیح می‌دهد سانس‌های عصر را رزرو کند.",
      joinedOffset: -95,
    },
    {
      name: "امیر حسینی",
      phone: "09121112233",
      email: "amir@example.com",
      credit: 0,
      notes: "بازیکن هفتگی؛ معمولاً زمین ۳ رزرو می‌کند.",
      joinedOffset: -60,
    },
    {
      name: "نگین شریفی",
      phone: "09122223344",
      email: null,
      credit: 350_000,
      notes: "",
      joinedOffset: -52,
    },
    {
      name: "محمد کریمی",
      phone: "09123334455",
      email: "mohammad@example.com",
      credit: 0,
      notes: "پدر یکی از نوجوان‌های آکادمی.",
      joinedOffset: -40,
    },
    {
      name: "الهام صادقی",
      phone: "09124445566",
      email: null,
      credit: 600_000,
      notes: "کلاس مقدماتی بزرگسالان.",
      joinedOffset: -31,
    },
    {
      name: "رضا نیک‌پور",
      phone: "09125556677",
      email: null,
      credit: 0,
      notes: "",
      joinedOffset: -24,
    },
    {
      name: "پریسا مرادی",
      phone: "09126667788",
      email: "parisa@example.com",
      credit: 150_000,
      notes: "یک راکت حرفه‌ای همیشه برایش کنار گذاشته شود.",
      joinedOffset: -18,
    },
    {
      name: "کیان اسدی",
      phone: "09127778899",
      email: null,
      credit: 0,
      notes: "",
      joinedOffset: -15,
    },
    {
      name: "مهسا رستمی",
      phone: "09128889900",
      email: null,
      credit: 0,
      notes: "کلاس نوجوانان.",
      joinedOffset: -12,
    },
    {
      name: "بهنام قاسمی",
      phone: "09129990011",
      email: null,
      credit: 0,
      notes: "دو پرداخت معوق؛ رزرو جدید فقط با تسویه.",
      blocked: true,
      blockedReason: "بدهی پرداخت‌نشده",
      joinedOffset: -90,
    },
    {
      name: "یاسمن اکبری",
      phone: "09121001122",
      email: null,
      credit: 250_000,
      notes: "",
      joinedOffset: -8,
    },
    {
      name: "سامان توکلی",
      phone: "09122112233",
      email: null,
      credit: 0,
      notes: "",
      joinedOffset: -3,
    },
  ];

  return seeds.map((seed, index) => ({
    id: index === 0 ? "customer-demo" : `customer-${index + 1}`,
    name: seed.name,
    phone: seed.phone,
    email: seed.email,
    joinedAt: addDays(today, seed.joinedOffset),
    credit: seed.credit,
    notes: seed.notes,
    blocked: seed.blocked ?? false,
    blockedReason: seed.blockedReason ?? null,
  }));
}

function buildBlocks(today: string, now: Date): Booking[] {
  const base = {
    customerId: null,
    customerName: "—",
    status: "blocked" as const,
    source: "admin" as const,
    coachId: null,
    equipment: [] as BookedEquipment[],
    packageId: null,
    subtotal: 0,
    coachTotal: 0,
    equipmentTotal: 0,
    discount: 0,
    total: 0,
    paid: false,
    paymentMethod: null as PaymentMethod | null,
    reviewed: false,
    createdAt: now.toISOString(),
    cancelledAt: null,
    cancellationPolicy: null,
  };

  return [
    {
      ...base,
      id: "block-1",
      courtId: "court-4",
      date: addDays(today, 1),
      startTime: "10:00",
      endTime: "12:00",
      blockReason: "maintenance",
      notes: "تعمیر و نگهداری سطح خاکی",
      confirmationCode: "BLOCK-1",
    },
    {
      ...base,
      id: "block-2",
      courtId: "court-1",
      date: addDays(today, 3),
      startTime: "08:00",
      endTime: "10:00",
      blockReason: "tournament",
      notes: "مسابقات جام باشگاه‌ها",
      confirmationCode: "BLOCK-2",
    },
  ];
}

export function createSeedDatabase(now = new Date()): MockDatabase {
  const today = toISODate(now);
  const random = mulberry32(20260101);
  const customers = buildCustomers(today);
  const coaches = buildCoaches(today);

  const pricingRules: PricingRule[] = [
    {
      id: "rule-evening",
      name: "ساعت پیک عصر",
      days: [6, 0, 1, 2, 3, 4],
      startTime: "17:00",
      endTime: "22:00",
      multiplier: 1.25,
      active: true,
    },
    {
      id: "rule-weekend-morning",
      name: "پیک آخر هفته",
      days: [4, 5],
      startTime: "08:00",
      endTime: "12:00",
      multiplier: 1.15,
      active: true,
    },
  ];

  const holidays: Holiday[] = [
    {
      id: "holiday-1",
      date: addDays(today, 9),
      name: "تعطیلات رسمی باشگاه",
      closed: true,
    },
    {
      id: "holiday-2",
      date: addDays(today, 17),
      name: "مسابقات باشگاهی",
      closed: false,
    },
  ];

  const isPeak = (date: string, startTime: string) => {
    const weekday = weekdayOf(date);
    const start = timeToMinutes(startTime);
    return pricingRules.some(
      (rule) =>
        rule.active &&
        rule.days.includes(weekday) &&
        start >= timeToMinutes(rule.startTime) &&
        start < timeToMinutes(rule.endTime),
    );
  };

  const usedSlots = new Set<string>();
  const blocks = buildBlocks(today, now);
  for (const block of blocks) {
    usedSlots.add(`${block.date}|${block.courtId}|${block.startTime}`);
  }

  const bookings: Booking[] = [];

  const createBooking = (
    offset: number,
    court: Court,
    startTime: string,
  ): Booking => {
    const date = addDays(today, offset);
    const sequence = bookings.length + 1;
    const endTime = minutesToTime(timeToMinutes(startTime) + 60);

    const peak = isPeak(date, startTime);
    const courtTotal = peak ? court.peakPricePerHour : court.basePricePerHour;

    const customer =
      sequence % 5 === 0
        ? customers[0]
        : customers[1 + (sequence % (customers.length - 1))];

    const coach =
      sequence % 4 === 1 ? coaches[sequence % coaches.length] : null;
    const coachTotal = coach ? coach.pricePerSession : 0;

    const bookedEquipment: BookedEquipment[] = [];
    let equipmentTotal = 0;

    if (sequence % 3 === 0) {
      for (const item of [equipment[0], equipment[2]]) {
        bookedEquipment.push({
          equipmentId: item.id,
          quantity: 1,
          pickedUp: offset < 0,
          returned: offset < 0,
        });
        equipmentTotal += item.pricePerSession;
      }
    }

    if (sequence % 9 === 0) {
      const machine = equipment[3];
      bookedEquipment.push({
        equipmentId: machine.id,
        quantity: 1,
        pickedUp: offset < 0,
        returned: offset < 0,
      });
      equipmentTotal += machine.pricePerSession;
    }

    let status: Booking["status"];
    if (offset < 0) {
      status =
        sequence % 11 === 0
          ? "no-show"
          : sequence % 7 === 0
            ? "cancelled"
            : "completed";
    } else if (offset === 0) {
      status = sequence % 4 === 0 ? "completed" : "confirmed";
    } else {
      status = "confirmed";
    }

    let cancellationPolicy: Booking["cancellationPolicy"] = null;
    if (status === "cancelled") {
      cancellationPolicy = offset >= 0 ? "rain" : sequence % 2 === 0 ? "free" : "late";
    }

    if (offset === 6 && sequence % 4 === 0) {
      status = "cancelled";
      cancellationPolicy = "rain";
    }

    const packageUsed = offset >= 0 && sequence % 13 === 0;
    const discount = packageUsed ? Math.round(courtTotal * 0.08) : 0;
    const subtotal = courtTotal + coachTotal + equipmentTotal;
    const source: Booking["source"] =
      sequence % 7 === 0
        ? sequence % 14 === 0
          ? "phone"
          : "walk-in"
        : "online";
    const paymentMethod: PaymentMethod | null = packageUsed
      ? "package"
      : source === "online"
        ? "online"
        : "cash";

    return {
      id: `booking-${String(sequence).padStart(2, "0")}`,
      courtId: court.id,
      customerId: customer.id,
      customerName: customer.name,
      date,
      startTime,
      endTime,
      status,
      source,
      coachId: coach?.id ?? null,
      equipment: bookedEquipment,
      packageId: packageUsed ? "pkg-10" : null,
      blockReason: null,
      notes: sequence % 8 === 0 ? "درخواست راکت چپ‌دست" : "",
      subtotal,
      coachTotal,
      equipmentTotal,
      discount,
      total: subtotal - discount,
      paid: status !== "cancelled",
      paymentMethod,
      confirmationCode: `SP-${1000 + sequence}`,
      reviewed: false,
      createdAt: new Date(`${addDays(date, -3)}T09:30:00`).toISOString(),
      cancelledAt:
        status === "cancelled"
          ? new Date(`${addDays(date, -1)}T12:00:00`).toISOString()
          : null,
      cancellationPolicy,
    };
  };

  const tryAddBooking = (offset: number): boolean => {
    const date = addDays(today, offset);
    const court = courts[Math.floor(random() * courts.length)];
    const startTime = slotStarts[Math.floor(random() * slotStarts.length)];
    const key = `${date}|${court.id}|${startTime}`;

    if (usedSlots.has(key)) return false;

    usedSlots.add(key);
    bookings.push(createBooking(offset, court, startTime));
    return true;
  };

  const heavyDays = new Set([-9, -3, 5, 11]);
  const closedDays = new Set(
    holidays.filter((holiday) => holiday.closed).map((holiday) => holiday.date),
  );

  for (let offset = -14; offset <= 13; offset += 1) {
    const date = addDays(today, offset);
    if (closedDays.has(date)) continue;

    const target = heavyDays.has(offset) ? 3 : 2;
    let created = 0;
    let guard = 0;

    while (created < target && guard < 80) {
      guard += 1;
      if (tryAddBooking(offset)) created += 1;
    }
  }

  // Keep the demo at exactly 60 reservations regardless of collisions.
  let guard = 0;
  while (bookings.length < 60 && guard < 600) {
    guard += 1;
    tryAddBooking(-14 + (guard % 28));
  }

  const completed = bookings.filter((booking) => booking.status === "completed");
  const reviews: Review[] = completed.slice(0, 10).map((booking, index) => {
    booking.reviewed = true;
    return {
      id: `review-${String(index + 1).padStart(2, "0")}`,
      bookingId: booking.id,
      customerId: booking.customerId ?? customers[0].id,
      customerName: booking.customerName,
      courtId: booking.courtId,
      coachId: booking.coachId,
      rating: index % 3 === 0 ? 5 : 4,
      comment: reviewComments[index] ?? reviewComments[0],
      createdAt: new Date(`${addDays(booking.date, 1)}T18:00:00`).toISOString(),
    };
  });

  const waitlist: WaitlistEntry[] = [
    {
      id: "wait-1",
      courtId: "court-3",
      customerId: "customer-2",
      customerName: "امیر حسینی",
      date: addDays(today, 2),
      startTime: "18:00",
      endTime: "19:00",
      status: "waiting",
      createdAt: now.toISOString(),
      note: "ترجیحاً زمین روباز",
    },
    {
      id: "wait-2",
      courtId: "court-4",
      customerId: "customer-demo",
      customerName: "سارا احمدی",
      date: addDays(today, 4),
      startTime: "17:00",
      endTime: "18:00",
      status: "offered",
      createdAt: now.toISOString(),
      note: "اگر سانس عصر خالی شد خبر بدهید",
    },
    {
      id: "wait-3",
      courtId: "court-1",
      customerId: "customer-5",
      customerName: "الهام صادقی",
      date: addDays(today, 6),
      startTime: "19:00",
      endTime: "20:00",
      status: "waiting",
      createdAt: now.toISOString(),
      note: "",
    },
  ];

  const customerPackages: CustomerPackage[] = [
    {
      id: "cp-1",
      customerId: "customer-demo",
      packageId: "pkg-10",
      purchasedAt: addDays(today, -21),
      sessionsTotal: 10,
      sessionsUsed: 4,
      expiresAt: addDays(today, 69),
    },
    {
      id: "cp-2",
      customerId: "customer-demo",
      packageId: "pkg-morning-5",
      purchasedAt: addDays(today, -8),
      sessionsTotal: 5,
      sessionsUsed: 2,
      expiresAt: addDays(today, 52),
    },
    {
      id: "cp-3",
      customerId: "customer-2",
      packageId: "pkg-10",
      purchasedAt: addDays(today, -30),
      sessionsTotal: 10,
      sessionsUsed: 7,
      expiresAt: addDays(today, 60),
    },
  ];

  const studentNotes: StudentNote[] = [
    {
      id: "note-1",
      coachId: "coach-1",
      customerId: "customer-4",
      note: "سرویس دوم را بهتر اجرا می‌کند؛ روی چرخش شانه کار کنیم.",
      date: addDays(today, -6),
    },
    {
      id: "note-2",
      coachId: "coach-1",
      customerId: "customer-demo",
      note: "فورهند پایدار؛ تمرین بازی پایه در دستور کار.",
      date: addDays(today, -2),
    },
    {
      id: "note-3",
      coachId: "coach-3",
      customerId: "customer-5",
      note: "حرکت پا نیاز به تمرین بیشتر دارد.",
      date: addDays(today, -4),
    },
  ];

  return {
    version: SEED_VERSION,
    seededFor: today,
    seededAt: now.toISOString(),
    courts,
    coaches,
    equipment,
    packages,
    groupClasses,
    customers,
    bookings: [...bookings, ...blocks].sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    ),
    waitlist,
    reviews,
    pricingRules,
    holidays,
    customerPackages,
    studentNotes,
  };
}

export const demoBookingWindowDays = siteConfig.booking.maxAdvanceDays;
