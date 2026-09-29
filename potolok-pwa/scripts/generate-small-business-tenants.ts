import fs from "fs";
import path from "path";
import { BusinessTenant } from "../src/types/tenant";

const TENANTS_DIR = path.resolve(process.cwd(), "tenants");

const SMALL_COMPANIES = [
  {
    slug: "bratiya-mario",
    name: "Братья Марио",
    tagline: "Монтаж натяжных потолков любой сложности в Москве",
    city: "Москва",
    phone: "+7 (967) 068-33-01",
    telegram: "@bratiyamario",
    whatsapp: "79670683301",
    address: "улица Космонавта Волкова, 10 ст1",
    accentColor: "#DC2626", // Mario Red
    surveyorName: "Лев Маркин",
    surveyorPhone: "+7 (967) 068-33-01",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 7500,
    features: [
      { title: "Честный монтаж", description: "Монтируем без наценок и скрытых доплат на объекте." },
      { title: "Бесплатный выезд с образцами", description: "Привезем каталоги полотен и образцы теневых профилей." }
    ]
  },
  {
    slug: "potolok-montazh",
    name: "Потолок-Монтаж",
    tagline: "Качественные натяжные потолки с гарантией по договору",
    city: "Москва",
    phone: "+7 (993) 900-45-00",
    telegram: "@potolok_montazh_moskva",
    whatsapp: "79939004500",
    address: "Верейская улица, 17",
    accentColor: "#2563EB",
    surveyorName: "Вадим Новожилов",
    surveyorPhone: "+7 (993) 900-45-00",
    workingHours: { start: "09:00", end: "20:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8000,
    features: [
      { title: "Собственные бригады", description: "Опытные мастера со стажем от 5 лет." },
      { title: "Лазерный замер", description: "Точный расчет площади и геометрии за 15 минут." }
    ]
  },
  {
    slug: "ama-potolok",
    name: "АМА Потолок",
    tagline: "Потолочные системы и встроенный свет под ключ",
    city: "Москва",
    phone: "+7 (916) 123-45-67",
    telegram: "@amapotolok",
    whatsapp: "79161234567",
    address: "Тайнинская ул., 12, корп. 2",
    accentColor: "#059669",
    surveyorName: "Алексей Никулин",
    surveyorPhone: "+7 (916) 123-45-67",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8000,
    features: [
      { title: "Светильники и треки", description: "Подбор и подключение освещения под ключ." },
      { title: "Фиксация цены", description: "Смета не меняется в процессе выполнения работ." }
    ]
  },
  {
    slug: "pyataya-stena",
    name: "Пятая Стена",
    tagline: "Современные натяжные потолки и теневой профиль в Новой Москве",
    city: "Москва",
    phone: "+7 (925) 555-44-33",
    telegram: "@pyataystena",
    whatsapp: "79255554433",
    address: "улица Бориса Пастернака, 14",
    accentColor: "#7C3AED",
    surveyorName: "До Ен Ли",
    surveyorPhone: "+7 (925) 555-44-33",
    workingHours: { start: "09:00", end: "21:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8500,
    features: [
      { title: "Работа в новостройках", description: "Большой опыт работы в жилых комплексах Новой Москвы." },
      { title: "Чистый монтаж", description: "Работаем с перфораторами с пылесосом." }
    ]
  },
  {
    slug: "brain-home",
    name: "Brain&Home",
    tagline: "Потолок возможностей: архитектурный свет и теневые решения",
    city: "Москва",
    phone: "+7 (925) 409-39-95",
    telegram: "@brain_home",
    whatsapp: "79254093995",
    address: "Гостиничная улица, 9а",
    accentColor: "#D97706",
    surveyorName: "Сергей Фокин",
    surveyorPhone: "+7 (925) 409-39-95",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 9000,
    features: [
      { title: "Архитектурные решения", description: "Теневые зазоры EuroKRAAB, световые линии и ниши под шторы." },
      { title: "Гарантия по договору", description: "Официальное гарантийное обязательство." }
    ]
  },
  {
    slug: "dom-neba",
    name: "Дом неба",
    tagline: "Натяжные потолки и декоративный безопасный свет",
    city: "Москва",
    phone: "+7 (926) 967-99-46",
    telegram: "@dom_neba_msk",
    whatsapp: "79269679946",
    address: "проспект Мира, 2",
    accentColor: "#0284C7",
    surveyorName: "Олег Еськов",
    surveyorPhone: "+7 (926) 967-99-46",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8000,
    features: [
      { title: "Безопасный монтаж", description: "Композитные баллоны и сертифицированное оборудование." },
      { title: "Полотна без запаха", description: "Экологичные материалы европейского стандарта." }
    ]
  },
  {
    slug: "home-decor",
    name: "Хоум Декор",
    tagline: "Торгово-монтажная компания натяжных потолков",
    city: "Москва",
    phone: "+7 (966) 046-07-52",
    telegram: "@home_decor_np",
    whatsapp: "79660460752",
    address: "Смольная улица, 12",
    accentColor: "#EA580C",
    surveyorName: "Иброхимжон Абытжанов",
    surveyorPhone: "+7 (966) 046-07-52",
    workingHours: { start: "08:30", end: "20:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 7500,
    features: [
      { title: "Выгодные цены", description: "Работаем напрямую без посредников." },
      { title: "Выезд замерщика 0 руб", description: "Бесплатный расчет сметы в любой точке Москвы." }
    ]
  },
  {
    slug: "spr-moscow",
    name: "СПР Потолки",
    tagline: "Профессиональная установка натяжных потолков в Москве",
    city: "Москва",
    phone: "+7 (936) 153-51-88",
    telegram: "@spr_77_potolki",
    whatsapp: "79361535188",
    address: "Белокаменное шоссе, 10",
    accentColor: "#0D9488",
    surveyorName: "Александр Кулешов",
    surveyorPhone: "+7 (936) 153-51-88",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 7000,
    features: [
      { title: "Оперативный выезд", description: "Приедем на замер в день обращения." },
      { title: "Качественные полотна", description: "Матовые, сатиновые и глянцевые фактуры." }
    ]
  },
  {
    slug: "studia-potolkov",
    name: "Потолочный Pro Интерьер",
    tagline: "Студия стильных натяжных потолков и карнизов",
    city: "Москва",
    phone: "+7 (916) 353-20-70",
    telegram: "@studia_potolkov",
    whatsapp: "79163532070",
    address: "1-я Квесисская ул., 18",
    accentColor: "#4F46E5",
    surveyorName: "Алексей Студийный",
    surveyorPhone: "+7 (916) 353-20-70",
    workingHours: { start: "09:00", end: "20:30", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 8500,
    features: [
      { title: "Скрытые карнизы ПК-5", description: "Красивые шторные ниши без видимых крепежей." },
      { title: "Точный расчет", description: "Честная смета без переплат." }
    ]
  },
  {
    slug: "na-potolki",
    name: "На-Потолки",
    tagline: "Монтаж натяжных потолков под ключ в Москве и МО",
    city: "Москва",
    phone: "+7 (926) 810-10-33",
    telegram: "@napotolkiru",
    whatsapp: "79268101033",
    address: "Берёзовая аллея, 14Б, стр. 2",
    accentColor: "#B38938",
    surveyorName: "Артур Гильманов",
    surveyorPhone: "+7 (926) 810-10-33",
    workingHours: { start: "09:00", end: "20:00", slotDurationMinutes: 120, bufferMinutes: 45 },
    minOrderAmount: 7500,
    features: [
      { title: "Гарантия качества", description: "Официальный договор на монтажные работы." },
      { title: "Каталог фактур", description: "Широкий выбор полотен европейских и фабричных брендов." }
    ]
  }
];

function generateSmall() {
  console.log("--> Starting generation of 10 small ceiling companies for 3500 RUB offers...");

  for (const item of SMALL_COMPANIES) {
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
            description: "Классическое матовое полотно европейского стандарта",
            pricePerSqM: 800,
            popular: true,
          },
          {
            id: "pongs-satin",
            name: "Pongs Сатиновый",
            description: "Шелковистая текстура с мягким рассеиванием света",
            pricePerSqM: 900,
          },
          {
            id: "descor-textile",
            name: "Descor Тканевый эко-потолок",
            description: "Дышащее полотно с эффектом оштукатуренной поверхности",
            pricePerSqM: 2200,
          },
        ],
        profiles: [
          {
            id: "eurokraab",
            name: "Теневой профиль EuroKRAAB",
            description: "Стильный интерьерный зазор 6 мм без плинтусов и заглушек",
            pricePerMeter: 1100,
            tag: "Хит 2026",
          },
          {
            id: "classic-pvc",
            name: "Классический с маскировочной лентой",
            description: "Надежный алюминиевый багет с аккуратной белой вставкой",
            pricePerMeter: 300,
          },
        ],
        lighting: [
          {
            id: "spotlights",
            name: "Точечные споты / светильники",
            description: "Монтаж платформы, проводка и подключение",
            pricePerUnit: 600,
            unit: "шт",
            defaultQty: 4,
          },
          {
            id: "light-lines",
            name: "Световые линии",
            description: "Линейная LED-подсветка в плоскости полотна",
            pricePerUnit: 2800,
            unit: "м.пог",
            defaultQty: 0,
          },
          {
            id: "chandelier",
            name: "Монтаж люстры",
            description: "Усиленная закладная под вес",
            pricePerUnit: 1100,
            unit: "шт",
            defaultQty: 1,
          },
        ],
        curtainNiches: [
          {
            id: "niche-pk5",
            name: "Скрытый карниз ПК-5 (3 ряда)",
            pricePerMeter: 2200,
          },
        ],
      },
      surveyors: [
        {
          id: `srv-${item.slug}-1`,
          name: item.surveyorName,
          role: "Инженер-замерщик",
          phone: item.surveyorPhone,
          districts: ["Москва и Подмосковье"],
          active: true,
        },
      ],
      features: item.features,
    };

    const outPath = path.join(dir, "business.json");
    fs.writeFileSync(outPath, JSON.stringify(tenantConfig, null, 2), "utf-8");
    console.log(`[CREATED] ${item.name} -> ${item.slug}`);
  }

  console.log(`\n--> Successfully created 10 small business tenants!`);
}

generateSmall();
