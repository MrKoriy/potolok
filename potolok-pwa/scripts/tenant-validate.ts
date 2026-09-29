import fs from "fs";
import path from "path";
import { BusinessTenantSchema } from "../src/types/tenant";

const TENANTS_DIR = path.resolve(process.cwd(), "tenants");

export function validateAllTenants(): boolean {
  console.log("--> Starting tenant validation check...");

  if (!fs.existsSync(TENANTS_DIR)) {
    console.error(`ERROR: Directory not found: ${TENANTS_DIR}`);
    return false;
  }

  const entries = fs.readdirSync(TENANTS_DIR, { withFileTypes: true });
  const tenantDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (tenantDirs.length === 0) {
    console.error("ERROR: No tenants found in ./tenants/");
    return false;
  }

  let hasError = false;

  for (const tenantDir of tenantDirs) {
    const configPath = path.join(TENANTS_DIR, tenantDir, "business.json");
    if (!fs.existsSync(configPath)) {
      console.error(`[FAIL] ${tenantDir}: missing business.json`);
      hasError = true;
      continue;
    }

    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const json = JSON.parse(raw);
      const parsed = BusinessTenantSchema.parse(json);

      if (parsed.slug !== tenantDir) {
        console.error(
          `[FAIL] ${tenantDir}: slug mismatch in business.json ("${parsed.slug}" !== "${tenantDir}")`
        );
        hasError = true;
        continue;
      }

      // Check working hours logic
      const startParts = parsed.workingHours.start.split(":").map(Number);
      const endParts = parsed.workingHours.end.split(":").map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      if (endMinutes <= startMinutes) {
        console.error(`[FAIL] ${tenantDir}: end working hour must be after start hour`);
        hasError = true;
        continue;
      }

      console.log(
        `[PASS] Tenant "${parsed.name}" (${parsed.slug}) is valid. City: ${parsed.city}. Accent: ${parsed.theme.accentColor}`
      );
    } catch (err) {
      console.error(`[FAIL] ${tenantDir}: validation error:`, err);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("Validation failed with errors.");
    return false;
  }

  console.log("--> All tenants passed validation successfully.");
  return true;
}

if (process.argv[1]?.endsWith("tenant-validate.ts")) {
  const success = validateAllTenants();
  process.exit(success ? 0 : 1);
}
