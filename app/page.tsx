import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Badge, SectionTitle } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/currency";
import { classLevelLabels, coachLevelLabels, surfaceLabels } from "@/lib/labels";
import { weekdayLabels } from "@/lib/mock/date-utils";
import { getDatabase } from "@/lib/mock/db";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";

export default function HomePage() {
  const db = getDatabase();
  const courts = [...db.courts].sort((a, b) => a.sortOrder - b.sortOrder);
  const coaches = db.coaches.filter((coach) => coach.active);
  const reviews = [...db.reviews].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-brand-strong text-white">
        <img
          src={asset("/images/hero.jpg")}
          alt="زمین تنیس باشگاه ست‌پوینت"
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-strong via-brand-strong/75 to-brand-strong/35" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold backdrop-blur">
              <span className="size-2 rounded-full bg-accent" />
              {siteConfig.brand.tagline} · {siteConfig.club.city}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              زمینت، ساعتت، بازیت.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-8 text-white/80 sm:text-base">
              چهار زمین تنیس، چهار مربی حرفه‌ای و همهٔ تجهیزات لازم — یک رزرو
              آنلاین ساده تا وقتی که توپ اول را می‌زنی.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/booking/"
                className="rounded-full bg-accent px-6 py-3 text-sm font-black text-accent-ink transition-transform hover:-translate-y-0.5"
              >
                رزرو زمین
              </Link>
              <Link
                href="/account/"
                className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                پنل مشتری
              </Link>
            </div>
          </div>

          <dl className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "زمین", value: courts.length },
              { label: "مربی", value: coaches.length },
              { label: "کلاس گروهی", value: db.groupClasses.length },
              { label: "نظر مشتری", value: reviews.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <dt className="text-[10px] font-semibold text-white/65">
                  {item.label}
                </dt>
                <dd className="mt-1 text-2xl font-black">
                  {new Intl.NumberFormat("fa-IR").format(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="زمین‌ها"
              title="روی هر سطحی که دوست داری بازی کن"
              description="دو زمین هارد سرپوشیده، یک هارد روباز با نورافکن و یک زمین خاک رس؛ همه با رزرو ساعتی و قیمت شفاف."
            />
            <Link
              href="/booking/"
              className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold text-brand transition-colors hover:border-brand"
            >
              دیدن زمان‌های خالی
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {courts.map((court, index) => (
            <Reveal key={court.id} delay={index * 0.05}>
              <article className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_60px_-50px_rgba(11,63,42,0.7)]">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={asset(court.image)}
                    alt={court.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
                    <Badge className="border-white/30 bg-black/40 text-white backdrop-blur">
                      {surfaceLabels[court.surface]}
                    </Badge>
                    <Badge className="border-white/30 bg-black/40 text-white backdrop-blur">
                      {court.environment === "indoor" ? "سرپوشیده" : "روباز"}
                    </Badge>
                    {court.hasLights ? (
                      <Badge className="border-white/30 bg-black/40 text-white backdrop-blur">
                        نورافکن
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-extrabold">{court.name}</h3>
                    <span className="shrink-0 text-xs font-bold text-brand">
                      {formatPrice(court.basePricePerHour)}
                      <span className="font-medium text-muted"> / ساعت</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    {court.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {court.amenities.map((amenity) => (
                      <Badge key={amenity}>{amenity}</Badge>
                    ))}
                  </div>
                  <Link
                    href={`/booking/?courtId=${court.id}`}
                    className="mt-4 inline-flex text-xs font-bold text-brand hover:underline"
                  >
                    رزرو این زمین ←
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-2/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <Reveal>
            <SectionTitle
              eyebrow="مربی‌ها"
              title="با مربی خودت بهتر بازی کن"
              description="از آکادمی نوجوانان تا آماده‌سازی مسابقه؛ هر جلسه شامل گرم‌کردن، تمرین اختصاصی و جمع‌بندی است."
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {coaches.map((coach, index) => (
              <Reveal key={coach.id} delay={index * 0.05}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={asset(coach.avatar)}
                      alt={coach.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold">{coach.name}</h3>
                      <Badge className="border-brand/20 bg-brand/5 text-brand">
                        {coachLevelLabels[coach.level]}
                      </Badge>
                    </div>
                    <p className="mt-2 flex-1 text-[11px] leading-6 text-muted">
                      {coach.bio}
                    </p>
                    <p className="mt-3 text-xs font-bold text-brand">
                      {formatPrice(coach.pricePerSession)}
                      <span className="font-medium text-muted"> / جلسه</span>
                    </p>
                    <Link
                      href={`/booking/?coachId=${coach.id}`}
                      className="mt-3 rounded-full border border-line px-3 py-2 text-center text-[11px] font-bold transition-colors hover:border-brand hover:text-brand"
                    >
                      رزرو جلسه
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <Reveal>
          <SectionTitle
            eyebrow="کلاس گروهی"
            title="هفته‌ای سه کلاس، برای هر سطحی"
            description="کلاس‌های گروهی کوچک با تمرین بازی‌محور و توجه مستقیم مربی."
          />
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {db.groupClasses.map((groupClass, index) => {
            const coach = coaches.find((item) => item.id === groupClass.coachId);
            return (
              <Reveal key={groupClass.id} delay={index * 0.05}>
                <article className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5">
                  <Badge className="w-fit border-brand/20 bg-brand/5 text-brand">
                    {classLevelLabels[groupClass.level]}
                  </Badge>
                  <h3 className="mt-3 text-base font-extrabold">
                    {groupClass.name}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-6 text-muted">
                    {groupClass.description}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-muted">روزها</dt>
                      <dd className="font-bold">
                        {groupClass.weekdays
                          .map((day) => weekdayLabels[day])
                          .join(" / ")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">ساعت</dt>
                      <dd className="font-bold">
                        {groupClass.startTime} · {groupClass.durationMinutes} دقیقه
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">مربی</dt>
                      <dd className="font-bold">{coach?.name ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">ظرفیت</dt>
                      <dd className="font-bold">
                        {groupClass.enrolledCustomerIds.length} / {groupClass.capacity}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm font-black text-brand">
                    {formatPrice(groupClass.pricePerSession)}
                    <span className="text-[11px] font-medium text-muted"> / جلسه</span>
                  </p>
                  <Link
                    href={`/booking/?coachId=${groupClass.coachId}`}
                    className="mt-3 rounded-full bg-brand-strong px-4 py-2.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    رزرو جلسه با این مربی
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface-2/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Reveal>
              <SectionTitle
                eyebrow="پکیج‌ها"
                title="بیشتر بازی کن، کمتر پرداخت کن"
                description="پکیج‌ها به‌صورت اعتبار جلسه‌ای در پنل مشتری قابل پیگیری هستند."
              />
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {db.packages.map((pkg, index) => (
                <Reveal key={pkg.id} delay={index * 0.05}>
                  <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold">{pkg.name}</h3>
                      {pkg.popular ? (
                        <Badge className="border-accent bg-accent text-accent-ink">
                          محبوب
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 flex-1 text-[11px] leading-6 text-muted">
                      {pkg.description}
                    </p>
                    <p className="mt-3 text-xl font-black text-brand">
                      {formatPrice(pkg.price)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {pkg.sessions} جلسه · اعتبار {pkg.validityDays} روز ·{" "}
                      {pkg.discountPercent}٪ تخفیف
                    </p>
                    <a
                      href={`tel:${siteConfig.club.phone}`}
                      className="mt-4 rounded-full border border-line px-4 py-2 text-center text-xs font-bold transition-colors hover:border-brand hover:text-brand"
                    >
                      خرید از پذیرش
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-line bg-surface p-5">
              <h3 className="text-sm font-extrabold">تجهیزات قابل اجاره</h3>
              <p className="mt-1 text-[11px] text-muted">
                در مرحلهٔ رزرو می‌توانی تجهیزات را هم به سانس اضافه کنی.
              </p>
              <ul className="mt-4 space-y-2.5">
                {db.equipment.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-line/70 pb-2 text-xs last:border-0 last:pb-0"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="shrink-0 text-muted">
                      {formatPrice(item.pricePerSession)}
                      <span className="text-[10px]"> · {item.stock} {item.unitLabel}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <Reveal>
          <SectionTitle
            eyebrow="نظر مشتری‌ها"
            title="تجربهٔ بازیکن‌های ست‌پوینت"
            description="بعد از هر بازی می‌توانی نظرت را ثبت کنی؛ ثبت نظر در پنل مشتری انجام می‌شود."
          />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal key={review.id} delay={Math.min(index * 0.03, 0.2)}>
              <figure className="h-full rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{review.customerName}</span>
                  <span className="text-xs text-amber-500">
                    {"★".repeat(review.rating)}
                    <span className="text-line">{"★".repeat(5 - review.rating)}</span>
                  </span>
                </div>
                <blockquote className="mt-2 text-xs leading-7 text-muted">
                  «{review.comment}»
                </blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:grid-cols-2 sm:py-20">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
              آدرس و ساعت کاری
            </p>
            <h2 className="mt-2 text-2xl font-black">دیر یا زود، می‌بینیمت</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {siteConfig.club.address}
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <span className="text-muted">تلفن: </span>
                <a href={`tel:${siteConfig.club.phone}`} className="font-bold">
                  {siteConfig.club.phone}
                </a>
              </p>
              <p>
                <span className="text-muted">هر روز: </span>
                <span className="font-bold" dir="ltr">
                  {siteConfig.booking.openTime} – {siteConfig.booking.closeTime}
                </span>
              </p>
            </div>
            <Link
              href="/booking/"
              className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-black text-accent-ink transition-transform hover:-translate-y-0.5"
            >
              زودتر زمینت را بگیر
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img
              src={asset("/images/gallery/ball.jpg")}
              alt="توپ تنیس روی زمین"
              className="h-52 w-full rounded-3xl object-cover sm:h-full"
            />
            <img
              src={asset("/images/gallery/coaching.jpg")}
              alt="تمرین تنیس با مربی"
              className="h-52 w-full rounded-3xl object-cover sm:h-full"
            />
          </div>
        </div>
      </section>

      <p className="sr-only">{copy.footer.note}</p>
    </div>
  );
}
