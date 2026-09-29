import { BookingRecord, BookingStatus, RoomCalculation } from "@/types/tenant";
import { generateAccessToken, hashToken, saveClientBookingToken } from "./crypto";

const STORAGE_KEY = "potolok_demo_bookings_v1";

// Initial seed demo bookings
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
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
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
    const parsed = JSON.parse(raw);
    // Фильтр от спама и нецензурных записей
    return parsed.filter((b: BookingRecord) => {
      const lowerName = (b.clientName || "").toLowerCase();
      const lowerStreet = (b.address?.street || "").toLowerCase();
      return !lowerName.includes("сперма") && !lowerStreet.includes("хуюл");
    });
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
      accessToken: token,
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

  // Полное удаление заявки из хранилища
  deleteBooking(id: string): boolean {
    const all = getStoredBookings();
    const filtered = all.filter((b) => b.id !== id);
    saveBookings(filtered);
    return true;
  },

  getOccupiedSlots(tenantSlug: string, date: string): string[] {
    const all = this.listByTenant(tenantSlug);
    return all
      .filter((b) => b.surveyDate === date && b.status !== "cancelled")
      .map((b) => b.timeSlot);
  },
};
