import React, { useState, useMemo } from "react";
import { useTenant } from "@/context/TenantContext";
import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { QuickQuoteDrawer } from "@/components/owner/QuickQuoteDrawer";
import { PricingManagerModal } from "@/components/owner/PricingManagerModal";
import { ScheduleManagerModal } from "@/components/owner/ScheduleManagerModal";
import { BookingStore } from "@/lib/booking-store";
import { formatPrice, formatDateRu } from "@/lib/utils";
import { BookingRecord, BookingStatus } from "@/types/tenant";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileEdit,
  TrendingUp,
  FileCheck,
  DollarSign,
  CalendarDays,
  Settings2,
  Trash2,
} from "lucide-react";

export const OwnerDashboardPage: React.FC = () => {
  const { slug } = useTenant();

  const [bookings, setBookings] = useState<BookingRecord[]>(() =>
    BookingStore.listByTenant(slug)
  );
  const [activeTab, setActiveTab] = useState<"all" | "new" | "in_progress" | "done">("all");
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);

  // New Management Modals State
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Re-fetch on tenant switch
  React.useEffect(() => {
    setBookings(BookingStore.listByTenant(slug));
  }, [slug]);

  // Analytics computation
  const metrics = useMemo(() => {
    const totalAppointments = bookings.length;
    const closedDeals = bookings.filter((b) => b.status === "deal_closed");
    const activeSurveys = bookings.filter(
      (b) => b.status === "new" || b.status === "confirmed" || b.status === "survey_in_progress"
    );

    const pipelineEstimateSum = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.estimatedPriceMin + b.estimatedPriceMax) / 2, 0);

    const closedRevenueSum = closedDeals.reduce(
      (sum, b) => sum + (b.estimatedPriceMin + b.estimatedPriceMax) / 2,
      0
    );

    return {
      totalAppointments,
      activeSurveysCount: activeSurveys.length,
      closedDealsCount: closedDeals.length,
      pipelineEstimateSum,
      closedRevenueSum,
      conversionRate: totalAppointments > 0 ? Math.round((closedDeals.length / totalAppointments) * 100) : 0,
    };
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    if (activeTab === "new") return bookings.filter((b) => b.status === "new");
    if (activeTab === "in_progress") {
      return bookings.filter(
        (b) => b.status === "confirmed" || b.status === "survey_in_progress"
      );
    }
    if (activeTab === "done") {
      return bookings.filter(
        (b) => b.status === "estimate_sent" || b.status === "deal_closed"
      );
    }
    return bookings;
  }, [bookings, activeTab]);

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const updated = BookingStore.updateStatus(bookingId, newStatus);
    if (updated) {
      setBookings(BookingStore.listByTenant(slug));
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm("Удалить эту заявку навсегда?")) {
      BookingStore.deleteBooking(bookingId);
      setBookings(BookingStore.listByTenant(slug));
    }
  };

  const handleQuoteSaved = (updated: BookingRecord) => {
    BookingStore.updateEstimate(
      updated.id,
      updated.estimatedPriceMin,
      updated.estimatedPriceMax,
      updated.rooms
    );
    BookingStore.updateStatus(updated.id, "estimate_sent");
    setBookings(BookingStore.listByTenant(slug));
    setEditingBooking(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16">
      <OwnerHeader />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        {/* Owner Quick Controls (Цены, Услуги, Бан слотов) */}
        <section className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Settings2 className="w-3.5 h-3.5 text-primary" />
              <span>Панель управления владельца</span>
            </span>
            <span className="text-[10px] text-primary font-semibold">Live Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="p-3 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 text-left transition-all flex flex-col justify-between space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Цены и услуги</div>
                <div className="text-[10px] text-muted-foreground">Прайс за м², треки, ниши</div>
              </div>
            </button>

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="p-3 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 text-left transition-all flex flex-col justify-between space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">График и баны</div>
                <div className="text-[10px] text-muted-foreground">Выходные, блокировка часов</div>
              </div>
            </button>
          </div>
        </section>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Активные замеры</span>
            </div>
            <div className="text-xl font-black text-foreground">
              {metrics.activeSurveysCount}
            </div>
            <div className="text-[10px] text-muted-foreground">В графике на этой неделе</div>
          </div>

          <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Договоров закрыто</span>
            </div>
            <div className="text-xl font-black text-foreground">
              {metrics.closedDealsCount}
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold">
              Конверсия {metrics.conversionRate}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-card border border-border space-y-1 col-span-2">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-primary" />
              <span>Оценка объема смет в воронке</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-primary">
                {formatPrice(metrics.pipelineEstimateSum)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Подписано на: {formatPrice(metrics.closedRevenueSum)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Все ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "new" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Новые ({bookings.filter((b) => b.status === "new").length})
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "in_progress"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            В работе
          </button>
          <button
            onClick={() => setActiveTab("done")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "done" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Сметы
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-card border border-border space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
              <div className="text-xs text-muted-foreground">В этой вкладке пока нет заявок</div>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <CardHeader className="p-3.5 pb-2 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-foreground">{b.clientName}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{formatDateRu(b.surveyDate)}, {b.timeSlot}</span>
                      </div>
                    </div>

                    {/* Status dropdown */}
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                      className="bg-card text-[11px] font-semibold border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                    >
                      <option value="new">Новая</option>
                      <option value="confirmed">Подтверждена</option>
                      <option value="survey_in_progress">На замере</option>
                      <option value="estimate_sent">Смета составлена</option>
                      <option value="deal_closed">Договор подписан</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 space-y-3 text-xs">
                  {/* Address & Phone */}
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {b.address.street} {b.address.house}
                        {b.address.apartment && `, кв. ${b.address.apartment}`}
                      </span>
                    </div>
                    {b.comment && (
                      <p className="text-[11px] italic bg-secondary/40 p-2 rounded border border-border/30">
                        {b.comment}
                      </p>
                    )}
                  </div>

                  {/* Price Estimate */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <span className="text-[11px] text-muted-foreground">Ориентир сметы:</span>
                    <span className="font-bold text-primary">
                      {formatPrice(b.estimatedPriceMin)} – {formatPrice(b.estimatedPriceMax)}
                    </span>
                  </div>

                  {/* Actions for Surveyor on Site */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${b.clientPhone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center justify-center gap-1.5 flex-1 h-9 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-medium text-xs border border-border"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>Позвонить</span>
                    </a>

                    <Button
                      size="sm"
                      onClick={() => setEditingBooking(b)}
                      className="flex-1 h-9 text-xs font-semibold gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Замер</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBooking(b.id)}
                      className="w-9 h-9 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-colors shrink-0"
                      title="Удалить заявку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Quick On-Site Quote Modal */}
      {editingBooking && (
        <QuickQuoteDrawer
          booking={editingBooking}
          isOpen={Boolean(editingBooking)}
          onClose={() => setEditingBooking(null)}
          onSave={handleQuoteSaved}
        />
      )}

      {/* Modal 1: Управление ценами и услугами */}
      <PricingManagerModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Modal 2: График, выходные и баны слотов */}
      <ScheduleManagerModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </div>
  );
};
