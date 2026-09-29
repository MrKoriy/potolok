import React, { useState, useMemo } from "react";
import { useTenant } from "@/context/TenantContext";
import { OwnerSettingsStore } from "@/lib/owner-settings-store";
import { Button } from "@/components/ui/button";
import { X, Calendar as CalendarIcon, Clock, Ban, CheckCircle2 } from "lucide-react";

interface ScheduleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SLOTS = [
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00",
];

export const ScheduleManagerModal: React.FC<ScheduleManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tenant } = useTenant();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [, setTick] = useState(0);

  const availableDates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const isBlocked = OwnerSettingsStore.isDateBlocked(tenant.slug, iso);
      const dayName = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : d.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNum = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      list.push({ iso, dayName, dayNum, isBlocked });
    }
    return list;
  }, [tenant.slug]);

  if (!isOpen) return null;

  const isCurrentDateBlocked = OwnerSettingsStore.isDateBlocked(tenant.slug, selectedDate);

  const handleToggleDateBlock = () => {
    OwnerSettingsStore.toggleBlockedDate(tenant.slug, selectedDate);
    setTick((t) => t + 1);
  };

  const handleToggleSlotBlock = (slot: string) => {
    OwnerSettingsStore.toggleBlockedSlot(tenant.slug, selectedDate, slot);
    setTick((t) => t + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card text-card-foreground border border-border w-full max-w-md max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Управление графиком и баны слотов</h2>
              <p className="text-[11px] text-muted-foreground">{tenant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Date Picker Ribbon */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Выберите день для настройки:</span>
              <span className="text-primary font-bold">{selectedDate}</span>
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {availableDates.map((item) => {
                const isSelected = item.iso === selectedDate;
                return (
                  <button
                    key={item.iso}
                    type="button"
                    onClick={() => setSelectedDate(item.iso)}
                    className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                        : item.isBlocked
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <span className="text-[10px] capitalize">{item.dayName}</span>
                    <span className="text-xs font-semibold">{item.dayNum}</span>
                    {item.isBlocked && <span className="text-[9px] font-bold">БАН</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Block whole day toggle */}
          <div className="p-3.5 rounded-xl bg-secondary/20 border border-border flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Ban className={`w-4 h-4 ${isCurrentDateBlocked ? "text-destructive" : "text-muted-foreground"}`} />
                <span>Заблокировать весь день</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Клиенты увидят статус «Выходной» и не смогут выбрать это число
              </p>
            </div>
            <Button
              size="sm"
              variant={isCurrentDateBlocked ? "destructive" : "outline"}
              onClick={handleToggleDateBlock}
              className="text-xs h-8 shrink-0"
            >
              {isCurrentDateBlocked ? "Разблокировать" : "Поставить бан"}
            </Button>
          </div>

          {/* Slots management */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Интервалы времени на {selectedDate}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Нажмите для бана/разбана</span>
            </div>

            {isCurrentDateBlocked ? (
              <div className="p-4 rounded-xl bg-secondary/40 text-center text-muted-foreground text-[11px]">
                Весь день помечен как выходной. Чтобы управлять отдельными слотами, снимите бан с дня.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_SLOTS.map((slot) => {
                  const isBlocked = OwnerSettingsStore.isSlotBlocked(tenant.slug, selectedDate, slot);

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleSlotBlock(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                        isBlocked
                          ? "bg-destructive/10 border-destructive/40 text-destructive shadow-sm"
                          : "bg-card border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className={isBlocked ? "line-through" : ""}>{slot}</span>
                      {isBlocked ? (
                        <Ban className="w-3.5 h-3.5 text-destructive shrink-0 ml-1" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
          <Button size="sm" onClick={onClose} className="px-6 font-bold">
            Готово
          </Button>
        </div>
      </div>
    </div>
  );
};
