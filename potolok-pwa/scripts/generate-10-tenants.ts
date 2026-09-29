import fs from "fs";
import path from "path";
import { BusinessTenant } from "../src/types/tenant";

const TENANTS_DIR = path.resolve(process.cwd(), "tenants");

const TENANT_DATA = [
  {
    slug: "potolochkin",
    name: "Потолочкин",
    tagline: "Студия натяжных потолков с 2012 года. Рейтинг 4.9 (1533 отзыва)",
    city: "Москва и МО",
    phone: "+7 (965) 366-58-95",
    telegram: "@ivan_potolochkin_bot",
    whatsapp: "79653665895",
    address: "Семёновский переулок, 15",
    accentColor: "#0D9488",
    surveyorName: "Сергей Семенов",
    surveyorPhone: "+7 (965) 366-58-95",
    workingHours: { start: "09:00", end: "21:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 9000,
    features: [
      { title: "Опыт с 2012 года", description: "Более 15 000 смонтированных объектов в Москве и Подмосковье." },
      { title: "Бесплатный 3D-замер", description: "Привезем образцы всех фактур и рассчитаем смету на месте за 15 минут." },
      { title: "Гарантия 15 лет", description: "Официальный договор и гарантийный сертификат на все полотна и швы." }
    ]
  },
  {
    slug: "vipceiling",
    name: "Випсилинг",
    tagline: "Федеральная сеть натяжных потолков №1. Рейтинг 5.0 (1960 отзывов)",
    city: "Москва и МО",
    phone: "+7 (925) 130-10-10",
    telegram: "@vispcom",
    whatsapp: "79251301010",
    address: "1-й Грайвороновский проезд, 20 ст36",
    accentColor: "#0284C7",
    surveyorName: "Михаил Громов",
    surveyorPhone: "+7 (925) 130-10-10",
    workingHours: { start: "08:30", end: "20:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8500,
    features: [
      { title: "Федеральный стандарт качества", description: "Собственные производственные линии и многоступенчатый контроль полотен." },
      { title: "Чистый монтаж", description: "Монтажные бригады с перфораторами с пылеудалением." },
      { title: "Каталог более 200 фактур", description: "Широкий выбор полотен от эконом до эксклюзивных тканевых решений." }
    ]
  },
  {
    slug: "geometria",
    name: "Геометрия",
    tagline: "Дизайнерские потолки и теневой профиль. Рейтинг 5.0 (432 отзыва)",
    city: "Москва",
    phone: "+7 (966) 976-42-69",
    telegram: "@geometry777",
    whatsapp: "79669764269",
    address: "Часовая улица, 9",
    accentColor: "#D97706",
    surveyorName: "Борис Широков",
    surveyorPhone: "+7 (966) 976-42-69",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 11000,
    features: [
      { title: "Экспертиза в теневых профилях", description: "Официальный сертифицированный партнер EuroKRAAB и Lumfer." },
      { title: "Точный лазерный проект", description: "Проектирование световых линий и трековых систем с гарантией стыков." },
      { title: "Работа по дизайн-проектам", description: "Реализуем сложные узлы примыкания точно по чертежам дизайнеров." }
    ]
  },
  {
    slug: "rumexpert",
    name: "РумЭксперт",
    tagline: "Потолочные системы и интерьерный свет. Рейтинг 5.0 (895 отзывов)",
    city: "Москва",
    phone: "+7 (495) 135-00-36",
    telegram: "@rumexpert",
    whatsapp: "74951350036",
    address: "ул. Грина, 15",
    accentColor: "#6366F1",
    surveyorName: "Сулико Сихарулидзе",
    surveyorPhone: "+7 (495) 135-00-36",
    workingHours: { start: "09:00", end: "21:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 10000,
    features: [
      { title: "Интегрированный свет", description: "Подбор и расчет магнитных треков, спотов и парящей контурной подсветки." },
      { title: "Бесплатная смета", description: "Детальный расчет стоимости работ и комплектующих прямо на объекте." },
      { title: "Без пыли и грязи", description: "Защита чистовой отделки и уборка после завершения монтажа." }
    ]
  },
  {
    slug: "master-potolkov",
    name: "Мастер Потолков",
    tagline: "Потолочные системы и декоративные покрытия. Рейтинг 5.0 (372 отзыва)",
    city: "Москва",
    phone: "+7 (910) 591-50-50",
    telegram: "@masterpotolkov_msk",
    whatsapp: "79105915050",
    address: "Киевское шоссе, 22-й км, 4, стр. 2",
    accentColor: "#B38938",
    surveyorName: "Руслан Зиганшин",
    surveyorPhone: "+7 (910) 591-50-50",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 9500,
    features: [
      { title: "Мастера высшей квалификации", description: "Опыт каждого монтажника в штате компании от 6 лет." },
      { title: "Экологичные материалы", description: "Полотна без запаха с европейскими сертификатами пожарной безопасности." },
      { title: "Быстрый выезд замерщика", description: "Инженер приедет в удобный 2-часовой интервал в день обращения." }
    ]
  },
  {
    slug: "potolok-alyanse",
    name: "Потолок-Альянс",
    tagline: "Премиальные натяжные потолки под ключ. Рейтинг 5.0 (478 отзывов)",
    city: "Москва",
    phone: "+7 (926) 511-00-86",
    telegram: "@potolok_alyanse",
    whatsapp: "79265110086",
    address: "1-я Останкинская ул., 1А",
    accentColor: "#059669",
    surveyorName: "Шамиль Нагметов",
    surveyorPhone: "+7 (926) 511-00-86",
    workingHours: { start: "08:30", end: "21:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 9000,
    features: [
      { title: "Безупречная репутация", description: "Более 450 положительных отзывов на независимых сервисах." },
      { title: "Фиксация цены", description: "Смета не меняется в процессе монтажа — всё строго по договору." },
      { title: "Премиум профили", description: "Теневые, парящие и бесщелевые решения ведущих производителей." }
    ]
  },
  {
    slug: "tehpotolki",
    name: "ТеХпотолки",
    tagline: "Технологичные потолочные системы и чистый монтаж. Рейтинг 5.0 (1247 отзывов)",
    city: "Москва",
    phone: "+7 (926) 495-90-39",
    telegram: "@Tehpotolki",
    whatsapp: "79264959039",
    address: "Рязанский просп., 97, корп. 2",
    accentColor: "#2563EB",
    surveyorName: "Артем Николаев",
    surveyorPhone: "+7 (926) 495-90-39",
    workingHours: { start: "08:00", end: "21:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8000,
    features: [
      { title: "Более 1200 отзывов", description: "Лидер по рейтингу в Москве среди монтажных компаний." },
      { title: "Монтаж за 1 день", description: "Стандартная комната монтируется за 3–4 часа без лишнего шума." },
      { title: "Прямые поставки полотен", description: "Выгодные цены напрямую от производителей MSD и Pongs." }
    ]
  },
  {
    slug: "intstyle",
    name: "ИнтСтайл",
    tagline: "Студия эстетичных потолков и трекового света. Рейтинг 4.9 (218 отзывов)",
    city: "Москва",
    phone: "+7 (985) 920-28-31",
    telegram: "@potolok_stail",
    whatsapp: "79859202831",
    address: "Перервинский бульвар, 22 к2",
    accentColor: "#EA580C",
    surveyorName: "Евгений Кульков",
    surveyorPhone: "+7 (985) 920-28-31",
    workingHours: { start: "09:00", end: "20:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 10500,
    features: [
      { title: "Архитектурный свет", description: "Проектирование современных сценариев освещения для гостиных и спален." },
      { title: "Безупречные углы", description: "Лазерная подгонка теневого профиля с идеальной геометрией стыков." },
      { title: "Договор и гарантия", description: "Официальное гарантийное обслуживание в течение всего срока службы." }
    ]
  },
  {
    slug: "potolki-nova",
    name: "Потолки Нова",
    tagline: "Световые потолки и теневые решения в Москве. Рейтинг 5.0 (222 отзыва)",
    city: "Москва",
    phone: "+7 (499) 398-04-88",
    telegram: "@nova_potolki_msk",
    whatsapp: "74993980488",
    address: "Пресненская наб., 12",
    accentColor: "#4F46E5",
    surveyorName: "Константин Белов",
    surveyorPhone: "+7 (499) 398-04-88",
    workingHours: { start: "09:00", end: "21:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 12000,
    features: [
      { title: "Премиум уровень Сити", description: "Реализация эксклюзивных проектов в жилых комплексах бизнес- и премиум-класса." },
      { title: "Скрытые карнизы ПК-5 и Lumfer", description: "Интеграция электрокарнизов и штор в плоскость потолка." },
      { title: "Бесшумный монтаж", description: "Использование современных газовых и аккумуляторных монтажных пистолетов." }
    ]
  },
  {
    slug: "potolki-smith",
    name: "Потолки Смит",
    tagline: "Архитектурные потолки и световой дизайн. Рейтинг 5.0 (197 отзывов)",
    city: "Москва",
    phone: "+7 (916) 353-20-70",
    telegram: "@potolkismith",
    whatsapp: "79163532070",
    address: "Болотниковская ул., 11, корп. 1",
    accentColor: "#A16207",
    surveyorName: "Артур Гильманов",
    surveyorPhone: "+7 (916) 353-20-70",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 11500,
    features: [
      { title: "Индивидуальный световой расчет", description: "Подбор люксов освещенности под назначение каждой комнаты." },
      { title: "Теневой евро-шов", description: "Никаких резиновых плинтусов и заглушек — только лаконичная тень." },
      { title: "Эко-полотна Descor и Clipso", description: "Премиальные дышащие тканевые потолки европейского производства." }
    ]
  }
];

function generate() {
  console.log("--> Starting generation of 10 real ceiling companies...");

  for (const item of TENANT_DATA) {
    const dir = path.join(TENANTS_DIR, item.slug);
    fs.mkdirSync(dir, { recursive: true });

    const tenantConfig: BusinessTenant = {
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      city: item.city,
      phone: item.phone,
      telegram: item.telegram,
      whatsapp: item.whatsapp,
      address: item.address,
      workingHours: item.workingHours,
      theme: {
        accentColor: item.accentColor,
        accentForeground: "#000000",
        borderRadius: "0.75rem",
        mode: "dark",
      },
      pricing: {
        minOrderAmount: item.minOrderAmount,
        canvases: [
          {
            id: "msd-premium",
            name: "MSD Premium Матовый",
            description: "Идеально гладкая матовая поверхность без отблесков, плотность 240 г/м²",
            pricePerSqM: 850,
            popular: true,
          },
          {
            id: "descor-textile",
            name: "Descor Эко-ткань (Германия)",
            description: "Премиальное бесшовное дышащее полотно с эффектом штукатурки",
            pricePerSqM: 2400,
          },
          {
            id: "pongs-satin",
            name: "Pongs Сатиновый",
            description: "Шелковистая фактура с мягким рассеиванием света",
            pricePerSqM: 950,
          },
        ],
        profiles: [
          {
            id: "eurokraab",
            name: "Теневой профиль EuroKRAAB 4.0",
            description: "Эстетичный зазор 6 мм вдоль стен без резиновых заглушек и плинтусов",
            pricePerMeter: 1200,
            tag: "Хит 2026",
          },
          {
            id: "floating-led",
            name: "Парящий потолок с подсветкой",
            description: "Контурное светодиодное свечение по периметру стен",
            pricePerMeter: 1500,
          },
          {
            id: "classic-pvc",
            name: "Классический с маскировочной лентой",
            description: "Стандартный надежный багет с аккуратной белой вставкой",
            pricePerMeter: 350,
          },
        ],
        lighting: [
          {
            id: "magnetic-tracks",
            name: "Врезная магнитная трек-система",
            description: "Шинопровод в плоскости полотна со сменными светильниками",
            pricePerUnit: 3800,
            unit: "м.пог",
            defaultQty: 0,
          },
          {
            id: "light-lines",
            name: "Световые линии (SLOTT)",
            description: "Встроенные яркие линейные LED-светильники",
            pricePerUnit: 2900,
            unit: "м.пог",
            defaultQty: 0,
          },
          {
            id: "spotlights",
            name: "Точечные споты GX53 / глубокие споты",
            description: "Монтаж платформы, проводка и коммутация светильника",
            pricePerUnit: 650,
            unit: "шт",
            defaultQty: 4,
          },
          {
            id: "chandelier",
            name: "Монтаж люстры",
            description: "Усиленная закладная под вес до 20 кг",
            pricePerUnit: 1200,
            unit: "шт",
            defaultQty: 1,
          },
        ],
        curtainNiches: [
          {
            id: "niche-pk5",
            name: "Алюминиевый карниз ПК-5 (3 ряда)",
            pricePerMeter: 2400,
          },
          {
            id: "niche-simple",
            name: "Скрытая ниша с перегибом полотна",
            pricePerMeter: 1400,
          },
        ],
      },
      surveyors: [
        {
          id: `srv-${item.slug}-1`,
          name: item.surveyorName,
          role: "Ведущий инженер-технолог",
          phone: item.surveyorPhone,
          districts: ["Все районы Москвы и МО"],
          active: true,
        },
      ],
      features: item.features,
    };

    const outPath = path.join(dir, "business.json");
    fs.writeFileSync(outPath, JSON.stringify(tenantConfig, null, 2), "utf-8");
    console.log(`[CREATED] ${item.name} -> ${item.slug}`);
  }

  console.log(`\n--> Successfully created 10 tenants!`);
}

generate();
