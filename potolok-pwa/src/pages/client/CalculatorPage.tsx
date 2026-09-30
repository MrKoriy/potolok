import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";
import { Header } from "@/components/client/Header";
import { CeilingCalculator } from "@/components/client/CeilingCalculator";
import { BottomNav } from "@/components/client/BottomNav";
import { RoomCalculation } from "@/types/tenant";
import { CheckCircle, Clock, ShieldCheck, Wrench } from "lucide-react";

export const CalculatorPage: React.FC = () => {
  const { tenant, slug } = useTenant();
  const navigate = useNavigate();

  const handleProceedToBooking = (data: {
    rooms: RoomCalculation[];
    minPrice: number;
    maxPrice: number;
  }) => {
    // Store preliminary calc in sessionStorage for booking step
    sessionStorage.setItem("potolok_active_calc", JSON.stringify(data));
    navigate(`/s/${slug}/booking/`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-36 space-y-6">
        {/* Interactive Calculator */}
        <CeilingCalculator onProceedToBooking={handleProceedToBooking} />

        {/* Company USP Features */}
        <section className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Преимущества {tenant.name}
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {tenant.features.map((f, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-card border border-border flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  {i === 0 ? (
                    <Clock className="w-4 h-4" />
                  ) : i === 1 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {f.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Official Guarantee Note */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Гарантия по договору:</span> 15 лет на полотна и 3 года на монтажные работы в компании {tenant.name}.
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
