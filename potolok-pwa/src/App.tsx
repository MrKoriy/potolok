import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TenantProvider } from "@/context/TenantContext";
import { CalculatorPage } from "@/pages/client/CalculatorPage";
import { BookingPage } from "@/pages/client/BookingPage";
import { BookingSuccessPage } from "@/pages/client/BookingSuccessPage";
import { BookingTrackingPage } from "@/pages/client/BookingTrackingPage";
import { OwnerDashboardPage } from "@/pages/owner/OwnerDashboardPage";
import { getDefaultTenantSlug } from "@/lib/tenant-registry";

export const App: React.FC = () => {
  const defaultSlug = getDefaultTenantSlug();

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect to default tenant */}
        <Route path="/" element={<Navigate to={`/s/${defaultSlug}/`} replace />} />

        {/* Multi-Tenant Route Hierarchy */}
        <Route
          path="/s/:slug/*"
          element={
            <TenantProvider>
              <Routes>
                {/* Client-Facing Experience */}
                <Route path="" element={<CalculatorPage />} />
                <Route path="booking" element={<BookingPage />} />
                <Route path="booking-success" element={<BookingSuccessPage />} />
                <Route path="my-booking" element={<BookingTrackingPage />} />

                {/* Owner & Surveyor Management */}
                <Route path="owner" element={<OwnerDashboardPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>
            </TenantProvider>
          }
        />

        {/* Global 404 */}
        <Route path="*" element={<Navigate to={`/s/${defaultSlug}/`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
