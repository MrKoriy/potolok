import fs from "fs";
import path from "path";
import { BusinessTenant } from "../src/types/tenant";

const args = process.argv.slice(2);

function getArgValue(key: string, defaultValue: string): string {
  const arg = args.find((a) => a.startsWith(`--${key}=`));
  if (arg) {
    return arg.split("=")[1].replace(/^["']|["']$/g, "");
  }
  return defaultValue;
}

const slug = getArgValue("slug", `potolok-${Date.now().toString(36)}`);
const name = getArgValue("name", "Новый Потолок Сервис");
const city = getArgValue("city", "Москва");
const phone = getArgValue("phone", "+7 (999) 000-00-00");
const accent = getArgValue("accent", "#f59e0b");

const targetDir = path.resolve(process.cwd(), "tenants", slug);

if (fs.existsSync(targetDir)) {
  console.error(`ERROR: Tenant with slug "${slug}" already exists at ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const newConfig: BusinessTenant = {
  slug,
  name,
  tagline: "Качественные натяжные потолки с гарантией по договору",
  city,
  phone,
  telegram: `@${slug.replace(/-/g, "_")}`,
  whatsapp: phone.replace(/[^0-9]/g, ""),
  address: "Центральный офис",
  workingHours: {
    start: "09:00",
    end: "20:00",
    slotDurationMinutes: 120,
    bufferMinutes: 45,
  },
  theme: {
    accentColor: accent,
    accentForeground: "#000000",
    borderRadius: "0.75rem",
    mode: "dark",
  },
  pricing: {
    minOrderAmount: 8000,
    canvases: [
      {
        id: "matte-standard",
        name: "MSD Classic Матовый",
        description: "Белоснежная фактура без бликов",
        pricePerSqM: 750,
        popular: true,
      },
      {
        id: "satin-standard",
        name: "Сатиновый декор",
        description: "Мягкий шелковый отблеск",
        pricePerSqM: 850,
      },
    ],
    profiles: [
      {
        id: "eurokraab",
        name: "Теневой профиль EuroKRAAB",
        description: "Аккуратный теневой шов 6 мм",
        pricePerMeter: 1100,
        tag: "Хит",
      },
      {
        id: "classic-pvc",
        name: "Классический с лентой",
        description: "Стандартный надежный багет",
        pricePerMeter: 300,
      },
    ],
    lighting: [
      {
        id: "spots",
        name: "Точечные светильники",
        description: "Установка и подключение",
        pricePerUnit: 550,
        unit: "шт",
        defaultQty: 4,
      },
      {
        id: "chandelier",
        name: "Люстра на планке",
        description: "Монтаж крепежной платформы",
        pricePerUnit: 1100,
        unit: "шт",
        defaultQty: 1,
      },
    ],
    curtainNiches: [
      {
        id: "niche-std",
        name: "Скрытый карниз для штор",
        pricePerMeter: 1200,
      },
    ],
  },
  surveyors: [
    {
      id: `srv-${slug}-1`,
      name: "Инженер-замерщик",
      role: "Специалист по замерам",
      phone,
      districts: ["Все районы"],
      active: true,
    },
  ],
  features: [
    {
      title: "Бесплатный выезд с каталогами",
      description: "Привезем образцы профилей и полотен на объект.",
    },
    {
      title: "Договор и гарантия",
      description: "Фиксируем финальную стоимость без доплат.",
    },
  ],
};

const configPath = path.join(targetDir, "business.json");
fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");

console.log(`[OK] Created new tenant "${name}" (${slug}) at:`);
console.log(`  -> ${configPath}`);
console.log(`To preview, run: npm run dev and visit http://localhost:5173/s/${slug}/`);
