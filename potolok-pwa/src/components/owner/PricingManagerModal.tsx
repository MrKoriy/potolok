import React, { useState } from "react";
import { useTenant } from "@/context/TenantContext";
import { OwnerSettingsStore } from "@/lib/owner-settings-store";
import { Button } from "@/components/ui/button";
import { X, Check, DollarSign, Layers, Sliders, RefreshCw, Sun, Bookmark } from "lucide-react";

interface PricingManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingManagerModal: React.FC<PricingManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tenant, refreshTenant } = useTenant();
  const pricing = tenant.pricing;

  const [minOrder, setMinOrder] = useState(pricing.minOrderAmount);
  const [canvases, setCanvases] = useState(pricing.canvases);
  const [profiles, setProfiles] = useState(pricing.profiles);
  const [lighting, setLighting] = useState(pricing.lighting);
  const [niches, setNiches] = useState(pricing.curtainNiches || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCanvasPriceChange = (id: string, price: number) => {
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pricePerSqM: price } : c))
    );
  };

  const handleProfilePriceChange = (id: string, price: number) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pricePerMeter: price } : p))
    );
  };

  const handleLightingPriceChange = (id: string, price: number) => {
    setLighting((prev) =>
      prev.map((l) => (l.id === id ? { ...l, pricePerUnit: price } : l))
    );
  };

  const handleNichePriceChange = (id: string, price: number) => {
    setNiches((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pricePerMeter: price } : n))
    );
  };

  const handleSave = () => {
    OwnerSettingsStore.updateSettings(tenant.slug, {
      customPricing: {
        minOrderAmount: minOrder,
        canvases: canvases.map((c) => ({ id: c.id, pricePerSqM: c.pricePerSqM })),
        profiles: profiles.map((p) => ({ id: p.id, pricePerMeter: p.pricePerMeter })),
        lighting: lighting.map((l) => ({ id: l.id, pricePerUnit: l.pricePerUnit })),
        curtainNiches: niches.map((n) => ({ id: n.id, pricePerMeter: n.pricePerMeter })),
      },
    });

    refreshTenant();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleResetToDefaults = () => {
    OwnerSettingsStore.updateSettings(tenant.slug, {
      customPricing: undefined,
    });
    refreshTenant();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card text-card-foreground border border-border w-full max-w-md max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Управление ценами и услугами</h2>
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
          {/* Min Order */}
          <div className="p-3.5 rounded-xl bg-secondary/20 border border-border space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Минимальная сумма заказа (₽)</span>
              <span className="text-primary font-bold">{minOrder.toLocaleString("ru-RU")} ₽</span>
            </label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              step={500}
              className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Canvases */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>1. Фактуры полотен (₽ / м²)</span>
            </div>
            <div className="space-y-2">
              {canvases.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl border border-border bg-secondary/10 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={c.pricePerSqM}
                      onChange={(e) => handleCanvasPriceChange(c.id, Number(e.target.value))}
                      className="w-20 h-8 px-2 rounded border border-border bg-card text-right font-bold text-foreground text-xs focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">₽/м²</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>2. Системы примыкания (₽ / пог.м)</span>
            </div>
            <div className="space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-border bg-secondary/10 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={p.pricePerMeter}
                      onChange={(e) => handleProfilePriceChange(p.id, Number(e.target.value))}
                      className="w-20 h-8 px-2 rounded border border-border bg-card text-right font-bold text-foreground text-xs focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">₽/м</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lighting */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-primary" />
              <span>3. Освещение и треки</span>
            </div>
            <div className="space-y-2">
              {lighting.map((l) => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-xl border border-border bg-secondary/10 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{l.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{l.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={l.pricePerUnit}
                      onChange={(e) => handleLightingPriceChange(l.id, Number(e.target.value))}
                      className="w-20 h-8 px-2 rounded border border-border bg-card text-right font-bold text-foreground text-xs focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">₽/{l.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Niches */}
          {niches.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Bookmark className="w-3.5 h-3.5 text-primary" />
                <span>4. Скрытые ниши и карнизы</span>
              </div>
              <div className="space-y-2">
                {niches.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl border border-border bg-secondary/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{n.name}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        value={n.pricePerMeter}
                        onChange={(e) => handleNichePriceChange(n.id, Number(e.target.value))}
                        className="w-20 h-8 px-2 rounded border border-border bg-card text-right font-bold text-foreground text-xs focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">₽/м</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-[11px] text-muted-foreground gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Сбросить в дефолт</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 font-bold px-5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Сохранено!</span>
              </>
            ) : (
              <span>Применить цены</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
