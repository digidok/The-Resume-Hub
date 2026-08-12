"use client";

import { createContext, useContext } from "react";

export const SidebarCollapseContext = createContext(false);

export function useSidebarCollapsed() {
  return useContext(SidebarCollapseContext);
}
