import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BusinessTenant } from "@/types/tenant";
import { getTenantBySlug, getDefaultTenantSlug, getAllTenants } from "@/lib/tenant-registry";
import { OwnerSettingsStore } from "@/lib/owner-settings-store";

interface TenantContextType {
  tenant: BusinessTenant;
  slug: string;
  allTenants: BusinessTenant[];
  switchTenant: (newSlug: string) => void;
  refreshTenant: () => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

function hexToHsl(hex: string): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const allTenants = useMemo(() => getAllTenants(), []);

  const activeSlug = slug || getDefaultTenantSlug();
  const [tenant, setTenant] = useState<BusinessTenant | null>(() => {
    const raw = getTenantBySlug(activeSlug);
    return raw ? OwnerSettingsStore.applyToTenant(raw) : null;
  });

  const refreshTenant = React.useCallback(() => {
    const found = getTenantBySlug(activeSlug);
    if (found) {
      setTenant(OwnerSettingsStore.applyToTenant(found));
    }
  }, [activeSlug]);

  useEffect(() => {
    const found = getTenantBySlug(activeSlug);
    if (found) {
      setTenant(OwnerSettingsStore.applyToTenant(found));
    } else {
      const defSlug = getDefaultTenantSlug();
      navigate(`/s/${defSlug}/`, { replace: true });
    }
  }, [activeSlug, navigate]);

  useEffect(() => {
    const handleUpdate = () => refreshTenant();
    window.addEventListener("tenant-settings-updated", handleUpdate);
    return () => window.removeEventListener("tenant-settings-updated", handleUpdate);
  }, [refreshTenant]);

  useEffect(() => {
    if (!tenant) return;
    document.title = `${tenant.name} — Запись на замер`;

    try {
      const hslColor = hexToHsl(tenant.theme.accentColor);
      document.documentElement.style.setProperty("--primary", hslColor);
      document.documentElement.style.setProperty("--ring", hslColor);
      document.documentElement.style.setProperty("--radius", tenant.theme.borderRadius || "0.75rem");
    } catch (e) {
      console.warn("Could not apply dynamic theme accent", e);
    }
  }, [tenant]);

  const switchTenant = (newSlug: string) => {
    navigate(`/s/${newSlug}/`);
  };

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Загрузка параметров компании...</p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, slug: activeSlug, allTenants, switchTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
