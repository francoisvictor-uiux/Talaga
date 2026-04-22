import { type LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color?: "blue" | "cyan" | "violet" | "emerald" | "gray" | "amber" | "indigo" | "pink" | "slate" | "rose" | "orange";
  actions?: React.ReactNode;
  className?: string;
}

const colorMap: Record<NonNullable<PageHeaderProps["color"]>, { bg: string; icon: string; ring: string }> = {
  blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    ring: "ring-blue-100" },
  cyan:    { bg: "bg-cyan-50",    icon: "text-cyan-600",    ring: "ring-cyan-100" },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  ring: "ring-violet-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
  gray:    { bg: "bg-gray-100",   icon: "text-gray-600",    ring: "ring-gray-200" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   ring: "ring-amber-100" },
  indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  ring: "ring-indigo-100" },
  pink:    { bg: "bg-pink-50",    icon: "text-pink-600",    ring: "ring-pink-100" },
  slate:   { bg: "bg-slate-100",  icon: "text-slate-600",   ring: "ring-slate-200" },
  rose:    { bg: "bg-rose-50",    icon: "text-rose-600",    ring: "ring-rose-100" },
  orange:  { bg: "bg-orange-50",  icon: "text-orange-600",  ring: "ring-orange-100" },
};

export function PageHeader({ icon: Icon, title, subtitle, color = "blue", actions, className }: PageHeaderProps) {
  const c = colorMap[color];
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-4", c.bg, c.ring)}>
          <Icon className={cn("w-5 h-5", c.icon)} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
