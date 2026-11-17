"use client";

import {
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, Field, Input, Tabs } from "@/components/ui";
import { AdminBookings } from "@/components/admin/bookings";
import { AdminCustomers } from "@/components/admin/customers";
import { AdminDashboard } from "@/components/admin/dashboard";
import { AdminResources } from "@/components/admin/resources";
import { AdminSchedule } from "@/components/admin/schedule";
import { siteConfig } from "@/config/site";
import { setSession, useSession } from "@/lib/auth";
import { resetDatabase } from "@/lib/data/store";

const tabs = [
  { id: "dashboard", label: "داشبورد", icon: <LayoutDashboard className="size-3.5" /> },
  { id: "schedule", label: "جدول", icon: <CalendarRange className="size-3.5" /> },
  { id: "bookings", label: "رزروها", icon: <ListChecks className="size-3.5" /> },
  { id: "resources", label: "مدیریت", icon: <Settings2 className="size-3.5" /> },
  { id: "customers", label: "مشتری‌ها", icon: <Users className="size-3.5" /> },
];

export function AdminPanel() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("dashboard");

  function login() {
    if (
      email.trim().toLowerCase() !== siteConfig.demoAccounts.admin.email ||
      password !== siteConfig.demoAccounts.admin.password
    ) {
      setError("ایمیل یا رمز عبور اشتباه است. از اطلاعات دمو استفاده کنید.");
      return;
    }

    setError(null);
    setSession({
      role: "admin",
      name: siteConfig.demoAccounts.admin.name,
    });
  }

  if (!session || session.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-14">
        <Card>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مدیر
          </p>
          <h1 className="mt-1 text-2xl font-black">ورود مدیر باشگاه</h1>
          <p className="mt-2 text-xs leading-6 text-muted">
            داشبورد درآمد، جدول زمین‌ها، مدیریت منابع و مشتری‌ها.
          </p>

          <div className="mt-5 space-y-3">
            <Field label="ایمیل">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                dir="ltr"
                placeholder="admin@demo.test"
                type="email"
              />
            </Field>
            <Field label="رمز عبور">
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                dir="ltr"
                placeholder="password"
                type="password"
              />
            </Field>
            <Button className="w-full" onClick={login}>ورود به پنل</Button>
            {error ? <Alert tone="error">{error}</Alert> : null}
          </div>

          <div className="mt-5 rounded-2xl bg-surface-2/70 p-3 text-[11px] leading-6 text-muted">
            <p className="font-bold text-foreground">اکانت دمو</p>
            <p dir="ltr" className="mt-1">admin@demo.test · password</p>
            <Link href="/booking/" className="mt-2 inline-flex font-bold text-brand">
              بازگشت به رزرو آنلاین ←
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مدیر
          </p>
          <h1 className="mt-1 text-2xl font-black">{session.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!window.confirm("همهٔ داده‌های دمو به حالت اولیه برگردند؟")) return;
              resetDatabase();
              window.location.reload();
            }}
          >
            بازنشانی دمو
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSession(null)}
          >
            <LogOut className="size-3.5" /> خروج
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      <div className="mt-5">
        {tab === "dashboard" ? <AdminDashboard /> : null}
        {tab === "schedule" ? <AdminSchedule /> : null}
        {tab === "bookings" ? <AdminBookings /> : null}
        {tab === "resources" ? <AdminResources /> : null}
        {tab === "customers" ? <AdminCustomers /> : null}
      </div>
    </div>
  );
}
