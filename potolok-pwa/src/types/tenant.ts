import { z } from "zod";

export const CanvasOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricePerSqM: z.number(),
  popular: z.boolean().optional(),
});

export const ProfileOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricePerMeter: z.number(),
  tag: z.string().optional(),
});

export const LightingOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricePerUnit: z.number(),
  unit: z.enum(["шт", "м.пог"]),
  defaultQty: z.number().default(0),
});

export const SurveyorResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  phone: z.string(),
  districts: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const BusinessTenantSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  tagline: z.string(),
  city: z.string(),
  phone: z.string(),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  workingHours: z.object({
    start: z.string(), // "09:00"
    end: z.string(), // "20:00"
    slotDurationMinutes: z.number().default(120),
    bufferMinutes: z.number().default(45),
  }),
  theme: z.object({
    accentColor: z.string(), // e.g. "#f59e0b" or "38 92% 50%"
    accentForeground: z.string().default("#000000"),
    borderRadius: z.string().default("0.75rem"),
    mode: z.enum(["dark", "light"]).default("dark"),
  }),
  pricing: z.object({
    minOrderAmount: z.number().default(8000),
    canvases: z.array(CanvasOptionSchema),
    profiles: z.array(ProfileOptionSchema),
    lighting: z.array(LightingOptionSchema),
    curtainNiches: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        pricePerMeter: z.number(),
      })
    ),
  }),
  surveyors: z.array(SurveyorResourceSchema),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

export type BusinessTenant = z.infer<typeof BusinessTenantSchema>;
export type CanvasOption = z.infer<typeof CanvasOptionSchema>;
export type ProfileOption = z.infer<typeof ProfileOptionSchema>;
export type LightingOption = z.infer<typeof LightingOptionSchema>;
export type SurveyorResource = z.infer<typeof SurveyorResourceSchema>;

export type RoomCalculation = {
  id: string;
  name: string; // e.g. "Гостиная"
  area: number; // m2
  perimeter: number; // m
  canvasId: string;
  profileId: string;
  spotsCount: number;
  tracksMeters: number;
  lightLinesMeters: number;
  chandeliersCount: number;
  curtainNicheMeters: number;
  curtainNicheId?: string;
};

export type BookingStatus =
  | "new"
  | "confirmed"
  | "survey_in_progress"
  | "estimate_sent"
  | "deal_closed"
  | "cancelled";

export type BookingRecord = {
  id: string;
  tenantSlug: string;
  clientName: string;
  clientPhone: string;
  address: {
    city: string;
    street: string;
    house: string;
    apartment?: string;
    floor?: string;
  };
  surveyDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "11:00 - 13:00"
  surveyorId?: string;
  accessToken: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  status: BookingStatus;
  comment?: string;
  rooms: RoomCalculation[];
  createdAt: string;
};
