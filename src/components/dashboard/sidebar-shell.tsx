"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { SidebarCollapseContext } from "@/components/dashboard/sidebar-context";

const STORAGE_KEY = "dashboard-sidebar-collapsed";

export function SidebarShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reading persisted UI state from localStorage on mount — a client-only
    // external system React can't know about during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`flex shrink-0 flex-col border-b border-slate-200 bg-white p-4 transition-[width] duration-200 md:h-screen md:border-b-0 md:border-r md:overflow-y-auto ${
        collapsed ? "md:w-20" : "md:w-64"
      } ${ready ? "" : "invisible md:visible"}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" aria-label="Resume Hub home">
          {collapsed ? <LogoMark className="h-8 w-8" /> : <Logo />}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <SidebarCollapseContext.Provider value={collapsed}>{children}</SidebarCollapseContext.Provider>
    </aside>
  );
}
