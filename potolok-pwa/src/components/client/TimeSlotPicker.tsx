import React, { useMemo } from "react";
import { BookingStore } from "@/lib/booking-store";
import { OwnerSettingsStore } from "@/lib/owner-settings-store";
import { Clock, Calendar as CalendarIcon, Check, Ban } from "lucide-react";

interface TimeSlotPickerProps {
  tenantSlug: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}

const DEFAULT_SLOTS = [
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00",
];

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  tenantSlug,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}) => {
  // Generate next 10 available dates starting from today
  const availableDates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const isBlocked = OwnerSettingsStore.isDateBlocked(tenantSlug, iso);
      const dayName = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : d.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNum = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      list.push({ iso, dayName, dayNum, isBlocked });
    }
    return list;
  }, [tenantSlug]);

  // Check occupied slots from bookings AND owner-blocked slots
  const occupiedSlots = useMemo(() => {
    const booked = BookingStore.getOccupiedSlots(tenantSlug, selectedDate);
    const blocked = DEFAULT_SLOTS.filter((s) => OwnerSettingsStore.isSlotBlocked(tenantSlug, selectedDate, s));
    return Array.from(new Set([...booked, ...blocked]));
  }, [tenantSlug, selectedDate]);

  const isCurrentDateBlocked = OwnerSettingsStore.isDateBlocked(tenantSlug, selectedDate);

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
          <span>Выберите день замера</span>
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableDates.map((item) => {
            const isSelected = item.iso === selectedDate;
            const isBlocked = item.isBlocked;

            return (
              <button
                key={item.iso}
                type="button"
                disabled={isBlocked}
                onClick={() => {
                  if (isBlocked) return;
                  onSelectDate(item.iso);
                  if (occupiedSlots.includes(selectedSlot)) {
                    onSelectSlot("");
                  }
                }}
                className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-xl border text-center transition-all ${
                  isBlocked
                    ? "bg-secondary/30 text-muted-foreground/40 border-border/40 cursor-not-allowed line-through"
                    : isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <span className="text-[11px] capitalize">{item.dayName}</span>
                <span className="text-sm font-semibold">{item.dayNum}</span>
                {isBlocked && <span className="text-[9px] text-destructive">Выходной</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Интервал приезда замерщика (окно 2 часа)</span>
        </label>

        {isCurrentDateBlocked ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-1">
            <Ban className="w-5 h-5 text-destructive mx-auto" />
            <div className="text-xs font-semibold text-destructive">На этот день выезды не осуществляются</div>
            <div className="text-[11px] text-muted-foreground">Пожалуйста, выберите другую дату в календаре выше</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_SLOTS.map((slot) => {
              const isOccupied = occupiedSlots.includes(slot);
              const isOwnerBlocked = OwnerSettingsStore.isSlotBlocked(tenantSlug, selectedDate, slot);
              const isSelected = selectedSlot === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => onSelectSlot(slot)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
                    isOccupied
                      ? "bg-secondary/40 border-border/40 text-muted-foreground/40 cursor-not-allowed line-through"
                      : isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{slot}</span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-primary-foreground" />
                  ) : isOwnerBlocked ? (
                    <span className="text-[10px] text-destructive">Бан</span>
                  ) : isOccupied ? (
                    <span className="text-[10px] text-muted-foreground">Занято</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground italic">
          Мастер позвонит за 30–40 минут до прибытия для подтверждения времени.
        </p>
      </div>
    </div>
  );
};
