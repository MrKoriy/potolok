import { BusinessTenant, BusinessTenantSchema } from "@/types/tenant";

// Dynamic import of all business.json files inside tenants directory
const tenantModules = import.meta.glob("/tenants/*/business.json", {
  eager: true,
  import: "default",
});

export const loadedTenants: Record<string, BusinessTenant> = {};

for (const path in tenantModules) {
  try {
    const raw = tenantModules[path];
    const parsed = BusinessTenantSchema.parse(raw);
    loadedTenants[parsed.slug] = parsed;
  } catch (err) {
    console.error(`Failed to parse tenant config at ${path}:`, err);
  }
}

export function getTenantBySlug(slug: string): BusinessTenant | null {
  return loadedTenants[slug] || null;
}

export function getAllTenants(): BusinessTenant[] {
  return Object.values(loadedTenants);
}

export function getDefaultTenantSlug(): string {
  const slugs = Object.keys(loadedTenants);
  return slugs.length > 0 ? slugs[0] : "status-potolok";
}
