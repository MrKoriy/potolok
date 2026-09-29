import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Header } from "@/components/client/Header";
import { BottomNav } from "@/components/client/BottomNav";
import { BookingStore } from "@/lib/booking-store";
import { getClientBookingToken } from "@/lib/crypto";
import { formatPrice, formatDateRu } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileSpreadsheet,
  Phone,
  CheckCircle2,
  Layers,
  Ban,
  UserCheck,
} from "lucide-react";
import { BookingStatus } from "@/types/tenant";

const STATUS_MAP: Record<
  BookingStatus,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }
> = {
  new: { label: "Новая заявка", variant: "warning" },
  confirmed: { label: "Подтверждено", variant: "success" },
  survey_in_progress: { label: "Замер в процессе", variant: "default" },
  estimate_sent: { label: "Смета готова", variant: "success" },
  deal_closed: { label: "Договор подписан", variant: "success" },
  cancelled: { label: "Отменено", variant: "destructive" },
};

export const BookingTrackingPage: React.FC = () => {
  const { tenant, slug } = useTenant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryId = searchParams.get("id");
  const queryToken = searchParams.get("token");

  // Determine active booking
  const activeBooking = useMemo(() => {
    // 1. If explicit query params given
    if (queryId) {
      if (queryToken) {
        const stored = BookingStore.getByToken(queryId, queryToken);
        if (stored) return stored;
      }
      const stored = BookingStore.getById(queryId);
      if (stored) return stored;
    }

    // 2. Otherwise look up saved client tokens in localStorage
    try {
      const tokensMap = JSON.parse(localStorage.getItem("potolok_client_tokens") || "{}");
      const bookingIds = Object.keys(tokensMap);
      if (bookingIds.length > 0) {
        // Get the latest one for this tenant
        const all = BookingStore.listByTenant(slug);
        const match = all.find((b) => bookingIds.includes(b.id));
        if (match) return match;
      }
    } catch (e) {
      console.warn("Could not check local tokens", e);
    }

    // 3. Fallback to latest booking for demo purposes
    const tenantBookings = BookingStore.listByTenant(slug);
    return tenantBookings[0] || null;
  }, [queryId, slug]);

  const [booking, setBooking] = useState(activeBooking);
  const [isCancelling, setIsCancelling] = useState(false);

  // Assigned surveyor info if present
  const surveyor = useMemo(() => {
    if (!booking?.surveyorId) return tenant.surveyors[0] || null;
    return tenant.surveyors.find((s) => s.id === booking.surveyorId) || tenant.surveyors[0];
  }, [booking, tenant.surveyors]);

  const handleCancel = () => {
    if (!booking) return;
    if (confirm("Вы уверены, что хотите отменить выезд замерщика?")) {
      setIsCancelling(true);
      const updated = BookingStore.updateStatus(booking.id, "cancelled");
      if (updated) {
        setBooking({ ...updated });
      }
      setIsCancelling(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold">У вас пока нет активных заявок</h2>
          <p className="text-xs text-muted-foreground">
            Рассчитайте стоимость потолка в калькуляторе и запишитесь на бесплатный замер.
          </p>
          <Button onClick={() => navigate(`/s/${slug}/`)}>К калькулятору</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const statusConfig = STATUS_MAP[booking.status] || STATUS_MAP.new;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        {/* Status Header */}
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground font-mono">
              Заявка № {booking.id.toUpperCase()}
            </div>
            <h2 className="text-base font-bold text-foreground">Статус замера</h2>
          </div>
          <Badge variant={statusConfig.variant} className="text-xs px-2.5 py-1">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Timeline tracker */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Этапы выполнения
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">
                Заявка принята и зафиксирована
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  booking.status !== "new" && booking.status !== "cancelled"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <span
                className={`text-xs ${
                  booking.status !== "new" && booking.status !== "cancelled"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Мастер-технолог назначен
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  booking.status === "survey_in_progress" ||
                  booking.status === "estimate_sent" ||
                  booking.status === "deal_closed"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <span
                className={`text-xs ${
                  booking.status === "survey_in_progress" ||
                  booking.status === "estimate_sent" ||
                  booking.status === "deal_closed"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Выезд на объект и лазерный замер
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  booking.status === "estimate_sent" || booking.status === "deal_closed"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <span
                className={`text-xs ${
                  booking.status === "estimate_sent" || booking.status === "deal_closed"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Финальная смета и подписание договора
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Specialist */}
        {surveyor && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Ваш инженер-замерщик</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">{surveyor.name}</div>
                <div className="text-xs text-muted-foreground">{surveyor.role}</div>
              </div>
              <a
                href={`tel:${surveyor.phone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Позвонить</span>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Visit Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Время и адрес</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Дата:</span>
              <span className="font-semibold text-foreground">
                {formatDateRu(booking.surveyDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Интервал:</span>
              <span className="font-semibold text-foreground">{booking.timeSlot}</span>
            </div>
            <div className="flex items-start justify-between gap-4 pt-1 border-t border-border/50">
              <span className="text-muted-foreground shrink-0">Адрес:</span>
              <span className="font-semibold text-foreground text-right">
                {booking.address.city}, {booking.address.street} {booking.address.house}
                {booking.address.apartment && `, кв. ${booking.address.apartment}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Breakdown */}
        {booking.rooms && booking.rooms.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Параметры помещений</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {booking.rooms.map((room, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-foreground">
                    <span>{room.name}</span>
                    <span className="text-primary">{room.area} м²</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Периметр: {room.perimeter} м | Споты: {room.spotsCount} шт | Скрытый карниз:{" "}
                    {room.curtainNicheMeters} м
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-bold text-xs">
                <span>Предварительная смета:</span>
                <span className="text-primary text-sm">
                  {formatPrice(booking.estimatedPriceMin)} – {formatPrice(booking.estimatedPriceMax)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel button if not cancelled */}
        {booking.status !== "cancelled" && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              isLoading={isCancelling}
              className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              <span>Отменить выезд замерщика</span>
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
