import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Header } from "@/components/client/Header";
import { BottomNav } from "@/components/client/BottomNav";
import { TimeSlotPicker } from "@/components/client/TimeSlotPicker";
import { BookingStore } from "@/lib/booking-store";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  User,
  ArrowLeft,
  CalendarCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { RoomCalculation } from "@/types/tenant";

export const BookingPage: React.FC = () => {
  const { tenant, slug } = useTenant();
  const navigate = useNavigate();

  // Load calculation from session storage or use defaults
  const activeCalc = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("potolok_active_calc");
      if (stored) {
        return JSON.parse(stored) as {
          rooms: RoomCalculation[];
          minPrice: number;
          maxPrice: number;
        };
      }
    } catch (e) {
      console.warn("Could not parse stored calc", e);
    }
    // Default fallback calculation
    return {
      rooms: [
        {
          id: "r-default",
          name: "Комната",
          area: 18,
          perimeter: 18,
          canvasId: tenant.pricing.canvases[0]?.id || "msd-premium",
          profileId: tenant.pricing.profiles[0]?.id || "eurokraab",
          spotsCount: 4,
          tracksMeters: 0,
          lightLinesMeters: 0,
          chandeliersCount: 1,
          curtainNicheMeters: 3,
        },
      ],
      minPrice: tenant.pricing.minOrderAmount,
      maxPrice: Math.round(tenant.pricing.minOrderAmount * 1.2),
    };
  }, [tenant]);

  // Booking Form State
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedSlot, setSelectedSlot] = useState("11:00 - 13:00");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [floor, setFloor] = useState("");
  const [comment, setComment] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSlot) {
      setErrorMessage("Пожалуйста, выберите интервал времени для замера.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Пожалуйста, укажите ваше имя.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage("Пожалуйста, укажите корректный номер телефона.");
      return;
    }
    if (!street.trim() || !house.trim()) {
      setErrorMessage("Пожалуйста, укажите улицу и номер дома для выезда мастера.");
      return;
    }

    setIsLoading(true);

    try {
      const { booking, token } = await BookingStore.createBooking({
        tenantSlug: slug,
        clientName: name,
        clientPhone: phone,
        address: {
          city: tenant.city,
          street: street.trim(),
          house: house.trim(),
          apartment: apartment.trim() || undefined,
          floor: floor.trim() || undefined,
        },
        surveyDate: selectedDate,
        timeSlot: selectedSlot,
        estimatedPriceMin: activeCalc.minPrice,
        estimatedPriceMax: activeCalc.maxPrice,
        rooms: activeCalc.rooms,
        comment: comment.trim() || undefined,
      });

      // Clear cached session calculation
      sessionStorage.removeItem("potolok_active_calc");

      // Navigate to confirmation page
      navigate(`/s/${slug}/booking-success?id=${booking.id}&token=${token}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Произошла ошибка при бронировании слота. Попробуйте еще раз.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate(`/s/${slug}/`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться к калькулятору</span>
        </button>

        {/* Selected Quote Banner */}
        <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Расчет передан в заявку:</span>
            </div>
            <div className="text-xs font-semibold text-foreground">
              {activeCalc.rooms.map((r) => `${r.name} (${r.area} м²)`).join(", ")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Вилка стоимости:</div>
            <div className="text-sm font-bold text-primary">
              {formatPrice(activeCalc.minPrice)} – {formatPrice(activeCalc.maxPrice)}
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Date & Time Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span>1. Время приезда мастера</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeSlotPicker
                tenantSlug={slug}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </CardContent>
          </Card>

          {/* 2. Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>2. Адрес объекта ({tenant.city})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Улица или проспект *"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Дом *"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  required
                />
                <Input
                  placeholder="Квартира"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                />
                <Input
                  placeholder="Этаж"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Client Contacts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>3. Контактные данные</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Ваше имя *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="Номер телефона для звонка мастера *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Input
                  placeholder="Комментарий (новостройка, высота потолков, пожелания)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit CTA */}
          <div className="space-y-2 pt-1">
            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-bold shadow-lg"
              isLoading={isLoading}
            >
              Подтвердить бесплатный выезд замерщика
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Без предоплаты и регистрации. Выезд мастера с каталогами образцов — 0 ₽.
            </p>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};
