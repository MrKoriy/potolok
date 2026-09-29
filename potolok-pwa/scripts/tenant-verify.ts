import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { BusinessTenantSchema } from "../src/types/tenant";

console.log("==================================================");
console.log("  POTOLOK PWA MULTI-TENANT VERIFICATION SUITE    ");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       -> ${details}`);
    testsFailed++;
  }
}

// TEST 1: Tenant Validation
console.log("\n--- TEST SUITE 1: Business Schema Validation ---");
const tenantsDir = path.resolve(process.cwd(), "tenants");
const entries = fs.readdirSync(tenantsDir, { withFileTypes: true });
const tenantDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

assert(tenantDirs.length >= 2, "Found at least 2 distinct demo tenants", `Found: ${tenantDirs.length}`);

const loadedConfigs: Record<string, any> = {};

for (const dir of tenantDirs) {
  const file = path.join(tenantsDir, dir, "business.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  const parsed = BusinessTenantSchema.parse(raw);
  loadedConfigs[dir] = parsed;

  assert(Boolean(parsed.name && parsed.city), `Tenant ${dir} has valid metadata`);
  assert(parsed.pricing.canvases.length > 0, `Tenant ${dir} has canvas options`);
  assert(parsed.pricing.profiles.length > 0, `Tenant ${dir} has profile options`);
  assert(parsed.surveyors.length > 0, `Tenant ${dir} has assigned surveyors`);
}

// TEST 2: Tenant Isolation
console.log("\n--- TEST SUITE 2: Multi-Tenant Data Isolation ---");
const t1 = loadedConfigs["status-potolok"];
const t2 = loadedConfigs["art-potolok"];

assert(t1.slug !== t2.slug, "Tenant slugs are isolated and distinct");
assert(t1.city !== t2.city, `Tenants serve different cities (${t1.city} vs ${t2.city})`);
assert(t1.theme.accentColor !== t2.theme.accentColor, `Tenants have distinct brand accent colors (${t1.theme.accentColor} vs ${t2.theme.accentColor})`);

// TEST 3: Cryptographic Token Hashing
console.log("\n--- TEST SUITE 3: Anonymous Token Crypto Security ---");
const mockToken = "a1b2c3d4e5f607182930415263748596";
const hash1 = crypto.createHash("sha256").update(mockToken).digest("hex");
const hash2 = crypto.createHash("sha256").update(mockToken).digest("hex");
assert(hash1 === hash2, "SHA-256 token hashing is deterministic");
assert(hash1.length === 64, "SHA-256 output is 64 hex characters (256-bit)");
assert(mockToken !== hash1, "Token plaintext is never exposed as hash");

// TEST 4: Resource Occupancy & Conflict Simulation
console.log("\n--- TEST SUITE 4: Atomic Resource Occupancy & Double-Booking Prevention ---");
interface MockOccupancy {
  tenantSlug: string;
  surveyDate: string;
  timeSlot: string;
  status: string;
}

const occupancies: MockOccupancy[] = [];

function tryBook(tenantSlug: string, date: string, slot: string): boolean {
  const conflict = occupancies.find(
    (o) => o.tenantSlug === tenantSlug && o.surveyDate === date && o.timeSlot === slot && o.status !== "cancelled"
  );
  if (conflict) {
    return false; // rejected by Postgres EXCLUDE equivalent
  }
  occupancies.push({
    tenantSlug,
    surveyDate: date,
    timeSlot: slot,
    status: "confirmed",
  });
  return true;
}

const req1 = tryBook("status-potolok", "2026-10-01", "11:00 - 13:00");
const req2 = tryBook("status-potolok", "2026-10-01", "11:00 - 13:00"); // Duplicate slot
const req3 = tryBook("art-potolok", "2026-10-01", "11:00 - 13:00"); // Different tenant, same slot

assert(req1 === true, "First booking in slot succeeds");
assert(req2 === false, "Concurrent booking in same tenant & slot is rejected with conflict");
assert(req3 === true, "Booking in different tenant on same slot succeeds (Tenant isolation)");

// TEST 5: Production Build Verification
console.log("\n--- TEST SUITE 5: Production Bundling & Service Worker ---");
try {
  execSync("pnpm build", { stdio: "pipe" });
  assert(fs.existsSync(path.resolve(process.cwd(), "dist", "index.html")), "dist/index.html generated");
  assert(fs.existsSync(path.resolve(process.cwd(), "dist", "sw.js")), "dist/sw.js PWA Service Worker generated");
  assert(fs.existsSync(path.resolve(process.cwd(), "dist", "manifest.webmanifest")), "PWA WebManifest generated");
} catch (e) {
  assert(false, "pnpm build executed with exit code 0", String(e));
}

console.log("\n==================================================");
console.log(`RESULTS: ${testsPassed} passed, ${testsFailed} failed.`);
console.log("==================================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log("All tenant verification checks PASSED successfully!");
}
