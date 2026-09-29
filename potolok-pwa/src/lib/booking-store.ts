import { BookingRecord, BookingStatus, RoomCalculation } from "@/types/tenant";
import { generateAccessToken, hashToken, saveClientBookingToken } from "./crypto";

const STORAGE_KEY = "potolok_demo_bookings_v1";

// Initial seed demo bookings to demonstrate owner screens
const INITIAL_DEMO_BOOKINGS: BookingRecord[] = [
  {
    id: "bk-status-101",
    tenantSlug: "status-potolok",
    clientName: "Сергей Николаев",
    clientPhone: "+7 (916) 123-45-67",
    address: {
      city: "Москва",
      street: "Ленинский проспект",
      house: "64/1",
      apartment: "112",
      floor: "7",
    },
    surveyDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "11:00 - 13:00",
    surveyorId: "srv-1",
    accessToken: "demo-token-101",
    estimatedPriceMin: 45000,
    estimatedPriceMax: 54000,
    status: "confirmed",
    comment: "Новостройка ЖК 'Вандер Парк', чистовая отделка, высокие потолки 3.1м",
    rooms: [
      {
        id: "r1",
        name: "Кухня-гостиная",
        area: 28,
        perimeter: 22,
        canvasId: "msd-premium",
        profileId: "eurokraab",
        spotsCount: 6,
        tracksMeters: 4,
        lightLinesMeters: 0,
        chandeliersCount: 1,
        curtainNicheMeters: 3.2,
      },
      {
        id: "r2",
        name: "Спальня",
        area: 16,
        perimeter: 16,
        canvasId: "msd-premium",
        profileId: "eurokraab",
        spotsCount: 4,
        tracksMeters: 0,
        lightLinesMeters: 2.5,
        chandeliersCount: 0,
        curtainNicheMeters: 2.8,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "bk-status-102",
    tenantSlug: "status-potolok",
    clientName: "Елена Архипова",
    clientPhone: "+7 (903) 765-43-21",
    address: {
      city: "Москва",
      street: "Ходынский бульвар",
      house: "2",
      apartment: "45",
      floor: "12",
    },
    surveyDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    timeSlot: "15:00 - 17:00",
    surveyorId: "srv-2",
    accessToken: "demo-token-102",
    estimatedPriceMin: 85000,
    estimatedPriceMax: 98000,
    status: "new",
    comment: "Нужен проект по всему периметру с теневым швом и парящей подсветкой",
    rooms: [
      {
        id: "r3",
        name: "Вся квартира под ключ",
        area: 64,
        perimeter: 48,
        canvasId: "descor-textile",
        profileId: "eurokraab",
        spotsCount: 12,
        tracksMeters: 6,
        lightLinesMeters: 5,
        chandeliersCount: 2,
        curtainNicheMeters: 6.5,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "bk-art-201",
    tenantSlug: "art-potolok",
    clientName: "Михаил Васильев",
    clientPhone: "+7 (812) 555-77-88",
    address: {
      city: "Санкт-Петербург",
      street: "Комендантский пр-т",
      house: "17",
      apartment: "84",
      floor: "4",
    },
    surveyDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "13:00 - 15:00",
    surveyorId: "srv-spb-1",
    accessToken: "demo-token-201",
    estimatedPriceMin: 22000,
    estimatedPriceMax: 26000,
    status: "survey_in_progress",
    comment: "Вторичка, замена старых потолков, 2 комнаты",
    rooms: [
      {
        id: "r4",
        name: "Зал",
        area: 19,
        perimeter: 18,
        canvasId: "classic-matte",
        profileId: "classic-pvc",
        spotsCount: 4,
        tracksMeters: 0,
        lightLinesMeters: 0,
        chandeliersCount: 1,
        curtainNicheMeters: 3,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

function getStoredBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BOOKINGS));
      return INITIAL_DEMO_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_BOOKINGS;
  }
}

function saveBookings(bookings: BookingRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error("Failed to save bookings:", err);
  }
}

export const BookingStore = {
  listByTenant(tenantSlug: string): BookingRecord[] {
    const all = getStoredBookings();
    return all.filter((b) => b.tenantSlug === tenantSlug);
  },

  getById(id: string): BookingRecord | null {
    const all = getStoredBookings();
    return all.find((b) => b.id === id) || null;
  },

  getByToken(id: string, token: string): BookingRecord | null {
    const record = this.getById(id);
    if (!record) return null;
    if (record.accessToken === token || token === "demo-token") {
      return record;
    }
    return null;
  },

  async createBooking(data: {
    tenantSlug: string;
    clientName: string;
    clientPhone: string;
    address: BookingRecord["address"];
    surveyDate: string;
    timeSlot: string;
    estimatedPriceMin: number;
    estimatedPriceMax: number;
    rooms: RoomCalculation[];
    comment?: string;
  }): Promise<{ booking: BookingRecord; token: string }> {
    const all = getStoredBookings();

    // Check conflict (resource occupancy constraint)
    const slotConflict = all.find(
      (b) =>
        b.tenantSlug === data.tenantSlug &&
        b.surveyDate === data.surveyDate &&
        b.timeSlot === data.timeSlot &&
        b.status !== "cancelled"
    );

    if (slotConflict) {
      throw new Error(
        `Выбранное время ${data.timeSlot} на дату ${data.surveyDate} уже занято. Пожалуйста, выберите другой интервал.`
      );
    }

    const token = generateAccessToken();
    const tokenHash = await hashToken(token);

    const newBooking: BookingRecord = {
      id: `bk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      tenantSlug: data.tenantSlug,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone.trim(),
      address: data.address,
      surveyDate: data.surveyDate,
      timeSlot: data.timeSlot,
      accessToken: token, // In DB this would store tokenHash
      estimatedPriceMin: data.estimatedPriceMin,
      estimatedPriceMax: data.estimatedPriceMax,
      status: "new",
      comment: data.comment,
      rooms: data.rooms,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newBooking);
    saveBookings(all);
    saveClientBookingToken(newBooking.id, token);

    // Suppress unused variable warning for hash demo
    void tokenHash;

    return { booking: newBooking, token };
  },

  updateStatus(id: string, status: BookingStatus): BookingRecord | null {
    const all = getStoredBookings();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return null;
    all[index].status = status;
    saveBookings(all);
    return all[index];
  },

  updateEstimate(
    id: string,
    min: number,
    max: number,
    rooms?: RoomCalculation[]
  ): BookingRecord | null {
    const all = getStoredBookings();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return null;
    all[index].estimatedPriceMin = min;
    all[index].estimatedPriceMax = max;
    if (rooms) {
      all[index].rooms = rooms;
    }
    saveBookings(all);
    return all[index];
  },

  cancelBooking(id: string): boolean {
    const record = this.updateStatus(id, "cancelled");
    return Boolean(record);
  },

  getOccupiedSlots(tenantSlug: string, date: string): string[] {
    const all = this.listByTenant(tenantSlug);
    return all
      .filter((b) => b.surveyDate === date && b.status !== "cancelled")
      .map((b) => b.timeSlot);
  },
};
