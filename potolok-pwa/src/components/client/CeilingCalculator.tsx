import React, { useState, useMemo } from "react";
import { useTenant } from "@/context/TenantContext";
import { RoomCalculation } from "@/types/tenant";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  
  Sliders,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface CeilingCalculatorProps {
  onProceedToBooking: (calculation: {
    rooms: RoomCalculation[];
    minPrice: number;
    maxPrice: number;
  }) => void;
}

const PRESET_ROOMS = [
  { name: "Гостиная", defaultArea: 20 },
  { name: "Спальня", defaultArea: 15 },
  { name: "Кухня", defaultArea: 12 },
  { name: "Санузел", defaultArea: 5 },
  { name: "Вся квартира", defaultArea: 54 },
];

export const CeilingCalculator: React.FC<CeilingCalculatorProps> = ({
  onProceedToBooking,
}) => {
  const { tenant } = useTenant();
  const pricing = tenant.pricing;

  const [roomName, setRoomName] = useState("Гостиная");
  const [area, setArea] = useState(18);
  const [customPerimeter, setCustomPerimeter] = useState<number | null>(null);

  // Default selections
  const [selectedCanvasId, setSelectedCanvasId] = useState(
    pricing.canvases[0]?.id || ""
  );
  const [selectedProfileId, setSelectedProfileId] = useState(
    pricing.profiles[0]?.id || ""
  );

  // Lighting & Extras state
  const [spotsCount, setSpotsCount] = useState(4);
  const [tracksMeters, setTracksMeters] = useState(0);
  const [lightLinesMeters, setLightLinesMeters] = useState(0);
  const [chandeliersCount, setChandeliersCount] = useState(1);
  const [curtainNicheMeters, setCurtainNicheMeters] = useState(3);

  // Estimated perimeter if not manually overridden
  const calculatedPerimeter = useMemo(() => {
    if (customPerimeter !== null) return customPerimeter;
    // Approximation for room perimeter from area (assuming typical ratio ~1:1.3)
    return Math.max(8, Math.round(Math.sqrt(area) * 4 * 1.05));
  }, [area, customPerimeter]);

  // Selected entities
  const selectedCanvas = useMemo(
    () => pricing.canvases.find((c) => c.id === selectedCanvasId) || pricing.canvases[0],
    [pricing.canvases, selectedCanvasId]
  );

  const selectedProfile = useMemo(
    () => pricing.profiles.find((p) => p.id === selectedProfileId) || pricing.profiles[0],
    [pricing.profiles, selectedProfileId]
  );

  // Total cost calculation
  const { minPrice, maxPrice } = useMemo(() => {
    const canvasCost = (selectedCanvas?.pricePerSqM || 0) * area;
    const profileCost = (selectedProfile?.pricePerMeter || 0) * calculatedPerimeter;

    // Lighting
    const spotItem = pricing.lighting.find((l) => l.id.includes("spot"));
    const trackItem = pricing.lighting.find((l) => l.id.includes("track"));
    const linesItem = pricing.lighting.find((l) => l.id.includes("line"));
    const chItem = pricing.lighting.find((l) => l.id.includes("chandel"));

    const spotsCost = (spotItem?.pricePerUnit || 600) * spotsCount;
    const tracksCost = (trackItem?.pricePerUnit || 3800) * tracksMeters;
    const lightLinesCost = (linesItem?.pricePerUnit || 2900) * lightLinesMeters;
    const chandelierCost = (chItem?.pricePerUnit || 1200) * chandeliersCount;

    // Niches
    const nichePricePerM = pricing.curtainNiches[0]?.pricePerMeter || 1400;
    const nicheCost = nichePricePerM * curtainNicheMeters;

    const baseSum =
      canvasCost +
      profileCost +
      spotsCost +
      tracksCost +
      lightLinesCost +
      chandelierCost +
      nicheCost;

    const finalMin = Math.max(pricing.minOrderAmount, Math.round(baseSum));
    // Max buffer +15% for extra corners, pipe bypasses, wiring accessories
    const finalMax = Math.round(finalMin * 1.15);

    return {
      minPrice: finalMin,
      maxPrice: finalMax,
      breakdown: {
        canvasCost,
        profileCost,
        lightingCost: spotsCost + tracksCost + lightLinesCost + chandelierCost,
        nicheCost,
      },
    };
  }, [
    area,
    calculatedPerimeter,
    selectedCanvas,
    selectedProfile,
    spotsCount,
    tracksMeters,
    lightLinesMeters,
    chandeliersCount,
    curtainNicheMeters,
    pricing,
  ]);

  const handleRoomSelect = (preset: { name: string; defaultArea: number }) => {
    setRoomName(preset.name);
    setArea(preset.defaultArea);
    setCustomPerimeter(null);
  };

  const handleProceed = () => {
    const room: RoomCalculation = {
      id: "room-1",
      name: roomName,
      area,
      perimeter: calculatedPerimeter,
      canvasId: selectedCanvas.id,
      profileId: selectedProfile.id,
      spotsCount,
      tracksMeters,
      lightLinesMeters,
      chandeliersCount,
      curtainNicheMeters,
    };

    onProceedToBooking({
      rooms: [room],
      minPrice,
      maxPrice,
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Feature Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-card to-secondary/30 border border-border space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
          <Sliders className="w-3.5 h-3.5" />
          <span>Калькулятор сметы онлайн</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Рассчитайте стоимость за 1 минуту
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Выберите параметры комнаты, тип полотна и профиля. Выезд замерщика с образцами материалов — бесплатно.
        </p>
      </div>

      {/* Room Preset Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Тип помещения
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_ROOMS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleRoomSelect(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                roomName === preset.name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Area & Perimeter Config */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Площадь и геометрия</span>
            </CardTitle>
            <span className="text-lg font-bold text-primary">{area} м²</span>
          </div>
          <CardDescription>
            Периметр стен: {calculatedPerimeter} м.пог (рассчитан автоматически)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              type="range"
              min={3}
              max={100}
              step={1}
              value={area}
              onChange={(e) => {
                setArea(Number(e.target.value));
                setCustomPerimeter(null);
              }}
              className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>3 м² (санузел)</span>
              <span>25 м²</span>
              <span>100 м² (дом)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            1. Фактура полотна
          </label>
          <span className="text-xs text-primary font-medium">
            от {selectedCanvas.pricePerSqM} ₽/м²
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {pricing.canvases.map((c) => {
            const isSelected = c.id === selectedCanvasId;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCanvasId(c.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-card border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                      {c.popular && (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4">
                          Популярно
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0 ml-2">
                    {c.pricePerSqM} ₽/м²
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            2. Система примыкания (Профиль)
          </label>
          <span className="text-xs text-primary font-medium">
            {selectedProfile.pricePerMeter} ₽/пог.м
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {pricing.profiles.map((p) => {
            const isSelected = p.id === selectedProfileId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-card border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{p.name}</span>
                      {p.tag && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary text-primary">
                          {p.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0 ml-2">
                    {p.pricePerMeter} ₽/м
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lighting and Extras */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>3. Освещение и скрытые карнизы</span>
          </CardTitle>
          <CardDescription>
            Укажите количество светильников и треков для точного расчета
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Spots */}
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Точечные светильники / споты</div>
              <div className="text-[11px] text-muted-foreground">монтаж закладной и подключение</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setSpotsCount((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-foreground">{spotsCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setSpotsCount((prev) => prev + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Magnetic Tracks */}
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Магнитные треки (м)</div>
              <div className="text-[11px] text-muted-foreground">врезной шинопровод в потолок</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setTracksMeters((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-foreground">{tracksMeters}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setTracksMeters((prev) => prev + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Light Lines */}
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Световые линии (м)</div>
              <div className="text-[11px] text-muted-foreground">встроенные LED-полосы</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setLightLinesMeters((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-foreground">{lightLinesMeters}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setLightLinesMeters((prev) => prev + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Chandelier */}
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Крепление люстры</div>
              <div className="text-[11px] text-muted-foreground">усиленная закладная</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setChandeliersCount((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-foreground">{chandeliersCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setChandeliersCount((prev) => prev + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Curtain Niche */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-foreground">Скрытый карниз для штор (м)</div>
              <div className="text-[11px] text-muted-foreground">ниша ПК-5 или перегиб</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurtainNicheMeters((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-foreground">{curtainNicheMeters}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurtainNicheMeters((prev) => prev + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Bottom Price Summary Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-20 p-3 bg-card/95 backdrop-blur border-t border-border shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Ориентировочная смета:</div>
            <div className="text-lg font-extrabold text-foreground">
              {formatPrice(minPrice)} – {formatPrice(maxPrice)}
            </div>
          </div>
          <Button onClick={handleProceed} size="default" className="font-semibold shadow-md gap-1.5">
            <span>Записаться на замер</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trust & Guarantee features */}
      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Что входит в бесплатный выезд замерщика:</span>
        </div>
        <ul className="space-y-1 pl-6 list-disc">
          <li>Точный лазерный 3D-замер углов и перепада высот</li>
          <li>Каталог полотен (матовый, сатин, ткань) и образцы профилей</li>
          <li>Фиксация цены в официальном договоре на 30 дней</li>
        </ul>
      </div>
    </div>
  );
};
