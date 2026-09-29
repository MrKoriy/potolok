import React from "react";
import { useTenant } from "@/context/TenantContext";
import { Phone, Send, ArrowRightLeft, ShieldCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Header: React.FC = () => {
  const { tenant, allTenants, switchTenant } = useTenant();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top Demo Bar to switch between tenants easily */}
      <div className="bg-secondary/40 border-b border-border/50 px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">Демо Multi-Tenant:</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
          <select
            value={tenant.slug}
            onChange={(e) => switchTenant(e.target.value)}
            className="bg-card text-foreground border border-border text-xs rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {allTenants.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground">{tenant.name}</h1>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-primary/40 text-primary">
              Замер 0 ₽
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span>{tenant.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
              title="Позвонить"
              aria-label="Позвонить"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {tenant.telegram && (
            <a
              href={`https://t.me/${tenant.telegram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
              title="Написать в Telegram"
              aria-label="Написать в Telegram"
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
