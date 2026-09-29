import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Calculator, Calendar, TicketCheck, Shield } from "lucide-react";

export const BottomNav: React.FC = () => {
  const { slug } = useTenant();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: "Расчет",
      path: `/s/${slug}/`,
      icon: Calculator,
      exact: true,
    },
    {
      label: "Запись",
      path: `/s/${slug}/booking/`,
      icon: Calendar,
      exact: false,
    },
    {
      label: "Мой замер",
      path: `/s/${slug}/my-booking/`,
      icon: TicketCheck,
      exact: false,
    },
    {
      label: "Владелец",
      path: `/s/${slug}/owner/`,
      icon: Shield,
      exact: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const isActive = item.exact
            ? currentPath === item.path
            : currentPath.startsWith(item.path);

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
