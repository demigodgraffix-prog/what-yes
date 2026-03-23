"use client";

import { useRouter, usePathname } from "next/navigation";
import { Play, ShoppingBag, User } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();

  const tabs = [
    { id: "play", label: "Live", icon: Play, path: "/" },
    { id: "sell", label: "Sell", icon: ShoppingBag, path: "/sell" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${
      isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-white/95 border-gray-200'
    }`}>
      <div className="flex justify-around items-center py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-all ${
                active
                  ? "text-purple-500"
                  : isDark
                    ? "text-gray-500 hover:text-white"
                    : "text-gray-400 hover:text-gray-900"
              }`}
              type="button"
            >
              <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]' : ''}`} />
              <span className={`text-[10px] ${active ? "font-semibold" : ""}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
