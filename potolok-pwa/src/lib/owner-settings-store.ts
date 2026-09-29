import { BusinessTenant } from "@/types/tenant";

export interface TenantCustomSettings {
  tenantSlug: string;
  customPricing?: {
    minOrderAmount?: number;
    canvases?: { id: string; pricePerSqM: number }[];
    profiles?: { id: string; pricePerMeter: number }[];
    lighting?: { id: string; pricePerUnit: number }[];
    curtainNiches?: { id: string; pricePerMeter: number }[];
  };
  blockedDates?: string[]; // YYYY-MM-DD
  blockedSlots?: { date: string; slot: string }[]; // Specific date + slot
}

const SETTINGS_KEY = "potolok_owner_settings_v1";

function getAllSettings(): Record<string, TenantCustomSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllSettings(data: Record<string, TenantCustomSettings>): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save owner settings:", err);
  }
}

export const OwnerSettingsStore = {
  getSettings(tenantSlug: string): TenantCustomSettings {
    const all = getAllSettings();
    return all[tenantSlug] || { tenantSlug, blockedDates: [], blockedSlots: [] };
  },

  updateSettings(tenantSlug: string, update: Partial<TenantCustomSettings>): void {
    const all = getAllSettings();
    all[tenantSlug] = {
      ...this.getSettings(tenantSlug),
      ...update,
      tenantSlug,
    };
    saveAllSettings(all);
    window.dispatchEvent(new Event("tenant-settings-updated"));
  },

  toggleBlockedDate(tenantSlug: string, date: string): boolean {
    const settings = this.getSettings(tenantSlug);
    const blockedDates = new Set(settings.blockedDates || []);
    let isBlocked = false;

    if (blockedDates.has(date)) {
      blockedDates.delete(date);
      isBlocked = false;
    } else {
      blockedDates.add(date);
      isBlocked = true;
    }

    this.updateSettings(tenantSlug, { blockedDates: Array.from(blockedDates) });
    return isBlocked;
  },

  toggleBlockedSlot(tenantSlug: string, date: string, slot: string): boolean {
    const settings = this.getSettings(tenantSlug);
    let slots = settings.blockedSlots || [];
    const exists = slots.some((s) => s.date === date && s.slot === slot);

    if (exists) {
      slots = slots.filter((s) => !(s.date === date && s.slot === slot));
    } else {
      slots = [...slots, { date, slot }];
    }

    this.updateSettings(tenantSlug, { blockedSlots: slots });
    return !exists;
  },

  isDateBlocked(tenantSlug: string, date: string): boolean {
    const settings = this.getSettings(tenantSlug);
    return Boolean(settings.blockedDates?.includes(date));
  },

  isSlotBlocked(tenantSlug: string, date: string, slot: string): boolean {
    const settings = this.getSettings(tenantSlug);
    if (settings.blockedDates?.includes(date)) return true;
    return Boolean(settings.blockedSlots?.some((s) => s.date === date && s.slot === slot));
  },

  applyToTenant(tenant: BusinessTenant): BusinessTenant {
    const settings = this.getSettings(tenant.slug);
    if (!settings.customPricing) return tenant;

    const cp = settings.customPricing;
    const updated = JSON.parse(JSON.stringify(tenant)) as BusinessTenant;

    if (cp.minOrderAmount != null) {
      updated.pricing.minOrderAmount = cp.minOrderAmount;
    }

    if (cp.canvases) {
      updated.pricing.canvases = updated.pricing.canvases.map((c) => {
        const override = cp.canvases?.find((o) => o.id === c.id);
        return override ? { ...c, pricePerSqM: override.pricePerSqM } : c;
      });
    }

    if (cp.profiles) {
      updated.pricing.profiles = updated.pricing.profiles.map((p) => {
        const override = cp.profiles?.find((o) => o.id === p.id);
        return override ? { ...p, pricePerMeter: override.pricePerMeter } : p;
      });
    }

    if (cp.lighting) {
      updated.pricing.lighting = updated.pricing.lighting.map((l) => {
        const override = cp.lighting?.find((o) => o.id === l.id);
        return override ? { ...l, pricePerUnit: override.pricePerUnit } : l;
      });
    }

    if (cp.curtainNiches) {
      updated.pricing.curtainNiches = updated.pricing.curtainNiches.map((n) => {
        const override = cp.curtainNiches?.find((o) => o.id === n.id);
        return override ? { ...n, pricePerMeter: override.pricePerMeter } : n;
      });
    }

    return updated;
  },
};
