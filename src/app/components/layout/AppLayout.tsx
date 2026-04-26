import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div dir="rtl" className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
