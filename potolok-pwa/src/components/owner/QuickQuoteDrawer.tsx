import React, { useState } from "react";
import { BookingRecord, RoomCalculation } from "@/types/tenant";
import { useTenant } from "@/context/TenantContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Check, Calculator } from "lucide-react";

interface QuickQuoteDrawerProps {
  booking: BookingRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBooking: BookingRecord) => void;
}

export const QuickQuoteDrawer: React.FC<QuickQuoteDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onSave,
}) => {
  const { tenant } = useTenant();
  const initialRoom = booking.rooms?.[0] || {
    id: "r1",
    name: "Помещение",
    area: 18,
    perimeter: 18,
    canvasId: tenant.pricing.canvases[0]?.id || "msd-premium",
    profileId: tenant.pricing.profiles[0]?.id || "eurokraab",
    spotsCount: 4,
    tracksMeters: 0,
    lightLinesMeters: 0,
    chandeliersCount: 1,
    curtainNicheMeters: 3,
  };

  const [area, setArea] = useState(initialRoom.area);
  const [perimeter, setPerimeter] = useState(initialRoom.perimeter);
  const [spots, setSpots] = useState(initialRoom.spotsCount);
  const [tracks, setTracks] = useState(initialRoom.tracksMeters);
  const [lightLines, setLightLines] = useState(initialRoom.lightLinesMeters);
  const [niches, setNiches] = useState(initialRoom.curtainNicheMeters);

  if (!isOpen) return null;

  // Real-time calculation based on on-site measurements
  const canvasObj = tenant.pricing.canvases.find((c) => c.id === initialRoom.canvasId) || tenant.pricing.canvases[0];
  const profileObj = tenant.pricing.profiles.find((p) => p.id === initialRoom.profileId) || tenant.pricing.profiles[0];

  const totalCalculated =
    (canvasObj?.pricePerSqM || 850) * area +
    (profileObj?.pricePerMeter || 1200) * perimeter +
    650 * spots +
    3800 * tracks +
    2900 * lightLines +
    1800 * niches;

  const handleSave = () => {
    const updatedRoom: RoomCalculation = {
      ...initialRoom,
      area,
      perimeter,
      spotsCount: spots,
      tracksMeters: tracks,
      lightLinesMeters: lightLines,
      curtainNicheMeters: niches,
    };

    const updatedBooking: BookingRecord = {
      ...booking,
      estimatedPriceMin: totalCalculated,
      estimatedPriceMax: totalCalculated,
      status: "estimate_sent",
      rooms: [updatedRoom],
    };

    onSave(updatedBooking);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Здравствуйте, ${booking.clientName}! Мы выполнили лазерный замер потолков для вашего объекта (${booking.address.street}, ${booking.address.house}). Финальная смета: ${formatPrice(totalCalculated)} с учетом полотен ${canvasObj.name} и профиля ${profileObj.name}. Ссылка на ваш проект: ${window.location.origin}/s/${tenant.slug}/my-booking/?id=${booking.id}&token=${booking.accessToken}`
    );
    window.open(`https://wa.me/${booking.clientPhone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Замер на объекте: {booking.clientName}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Внесите фактические данные лазерного замера для формирования точной сметы:
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-muted-foreground block mb-1">Фактическая площадь (м²)</label>
            <Input
              type="number"
              step="0.1"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Периметр стен (м.пог)</label>
            <Input
              type="number"
              step="0.5"
              value={perimeter}
              onChange={(e) => setPerimeter(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Точек света / спотов (шт)</label>
            <Input
              type="number"
              value={spots}
              onChange={(e) => setSpots(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Магнитных треков (м)</label>
            <Input
              type="number"
              value={tracks}
              onChange={(e) => setTracks(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Световых линий (м)</label>
            <Input
              type="number"
              value={lightLines}
              onChange={(e) => setLightLines(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Ниш под карниз (м)</label>
            <Input
              type="number"
              value={niches}
              onChange={(e) => setNiches(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Итоговая смета договора:</span>
          <span className="text-lg font-black text-primary">{formatPrice(totalCalculated)}</span>
        </div>

        <div className="space-y-2 pt-2">
          <Button onClick={handleSave} className="w-full gap-2 font-bold">
            <Check className="w-4 h-4" />
            <span>Зафиксировать смету в заказе</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleShareWhatsApp}
            className="w-full gap-2 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Отправить КП клиенту в WhatsApp</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
