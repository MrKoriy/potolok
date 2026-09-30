import React from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Shield, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const OwnerHeader: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>Кабинет замерщика и владельца</span>
        </div>
        <Link
          to={`/s/${tenant.slug}/`}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline"
        >
          <Eye className="w-3 h-3" />
          <span>Вид клиента</span>
        </Link>
      </div>

      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-foreground">{tenant.name}</h1>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border">
              {tenant.city}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Система управления замерами</p>
        </div>
      </div>
    </header>
  );
};
