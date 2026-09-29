import React, { useMemo } from "react";
import { BookingStore } from "@/lib/booking-store";
import { Clock, Calendar as CalendarIcon, Check } from "lucide-react";

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
  // Generate next 7 available dates starting from tomorrow or today
  const availableDates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : d.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNum = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      list.push({ iso, dayName, dayNum });
    }
    return list;
  }, []);

  // Check occupied slots for the selected date
  const occupiedSlots = useMemo(() => {
    return BookingStore.getOccupiedSlots(tenantSlug, selectedDate);
  }, [tenantSlug, selectedDate]);

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
            return (
              <button
                key={item.iso}
                type="button"
                onClick={() => {
                  onSelectDate(item.iso);
                  // Reset slot if current selected slot is occupied on new date
                  if (occupiedSlots.includes(selectedSlot)) {
                    onSelectSlot("");
                  }
                }}
                className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <span className="text-[11px] capitalize">{item.dayName}</span>
                <span className="text-sm font-semibold">{item.dayNum}</span>
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
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_SLOTS.map((slot) => {
            const isOccupied = occupiedSlots.includes(slot);
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
                ) : isOccupied ? (
                  <span className="text-[10px] text-muted-foreground">Занято</span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Мастер позвонит за 30–40 минут до прибытия для подтверждения времени.
        </p>
      </div>
    </div>
  );
};
