import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Header } from "@/components/client/Header";
import { BottomNav } from "@/components/client/BottomNav";
import { BookingStore } from "@/lib/booking-store";
import { formatPrice, formatDateRu } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Key,
  Copy,
  ArrowRight,
  Download,
} from "lucide-react";

export const BookingSuccessPage: React.FC = () => {
  const { tenant, slug } = useTenant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";

  const booking = useMemo(() => {
    if (!bookingId) return null;
    return BookingStore.getById(bookingId);
  }, [bookingId]);

  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/s/${slug}/my-booking/?id=${bookingId}&token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate lightweight ICS calendar file
  const handleDownloadIcs = () => {
    if (!booking) return;
    const cleanDate = booking.surveyDate.replace(/-/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Potolok Service//RU",
      "BEGIN:VEVENT",
      `SUMMARY:Замер натяжных потолков (${tenant.name})`,
      `DESCRIPTION:Выезд мастера по адресу: ${booking.address.street} ${booking.address.house}. Тел: ${tenant.phone}`,
      `LOCATION:${booking.address.city}, ${booking.address.street} ${booking.address.house}`,
      `DTSTART:${cleanDate}T090000`,
      `DTEND:${cleanDate}T110000`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `zamer-${booking.surveyDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 text-center space-y-4">
          <p className="text-muted-foreground">Запись не найдена или была удалена.</p>
          <Button onClick={() => navigate(`/s/${slug}/`)}>На главную</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        {/* Success Card */}
        <div className="p-5 rounded-2xl bg-card border border-primary/30 text-center space-y-3 shadow-lg">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <Badge variant="success" className="mb-2">
              Заявка успешно принята
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Замер подтвержден!
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Инженер-технолог приедет в назначенное время с полным комплектом каталогов полотен и профилей.
            </p>
          </div>
        </div>

        {/* Appointment Details */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Детали визита</span>
              </CardTitle>
              <span className="text-[11px] font-mono text-muted-foreground">
                № {booking.id.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <div className="flex items-start gap-2.5 text-xs">
              <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Дата визита</div>
                <div className="text-muted-foreground">{formatDateRu(booking.surveyDate)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Временной интервал</div>
                <div className="text-muted-foreground">{booking.timeSlot}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Адрес объекта</div>
                <div className="text-muted-foreground">
                  {booking.address.city}, ул. {booking.address.street}, д. {booking.address.house}
                  {booking.address.apartment && `, кв./оф. ${booking.address.apartment}`}
                  {booking.address.floor && `, этаж ${booking.address.floor}`}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Предварительная смета:</span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(booking.estimatedPriceMin)} – {formatPrice(booking.estimatedPriceMax)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Anonymous Access Token Info */}
        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Key className="w-4 h-4 text-primary" />
            <span>Прямой доступ без пароля</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Вам не нужно регистрироваться. Страница вашего замера привязана к криптографическому токену на этом устройстве.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full text-xs gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Ссылка скопирована!" : "Скопировать персональную ссылку"}</span>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="default"
            className="w-full font-semibold gap-2"
            onClick={() =>
              navigate(`/s/${slug}/my-booking/?id=${booking.id}&token=${token || booking.accessToken}`)
            }
          >
            <span>Перейти к отслеживанию статуса</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            className="w-full font-medium gap-2"
            onClick={handleDownloadIcs}
          >
            <Download className="w-4 h-4" />
            <span>Добавить в календарь (.ics)</span>
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
