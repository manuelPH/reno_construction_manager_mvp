"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RenoSidebar } from "@/components/reno/reno-sidebar";
import { getPropertyById, Property, updateProperty } from "@/lib/property-storage";
import { FutureDatePicker } from "@/components/property/future-date-picker";
import { useI18n } from "@/lib/i18n";
import { RenoKanbanPhase } from "@/lib/reno-kanban-config";

export default function RenoPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if property is in upcoming-settlements phase
  const getPropertyRenoPhase = useCallback((prop: Property): RenoKanbanPhase => {
    // For demo, check by ID. In production, this would come from backend
    if (["4463793", "4463794", "4463795", "4463796", "4463797", "4463798", "4463799", "4463800"].includes(prop.id)) {
      return "upcoming-settlements";
    } else if (["4463801", "4463802", "4463803"].includes(prop.id)) {
      return "initial-check";
    } else if (["4463804", "4463805"].includes(prop.id)) {
      return "upcoming";
    } else if (["4463806", "4463807", "4463808"].includes(prop.id)) {
      return "reno-in-progress";
    } else if (["4463809", "4463810"].includes(prop.id)) {
      return "furnishing-cleaning";
    } else if (prop.id === "4463811") {
      return "final-check";
    } else if (prop.id === "4463812") {
      return "reno-fixes";
    } else if (["4463813", "4463814"].includes(prop.id)) {
      return "done";
    }
    return "initial-check";
  }, []);

  // Auto-save function
  const handleAutoSave = useCallback((updates: Partial<Property>) => {
    if (!property) return;
    updateProperty(property.id, updates);
    // Reload property to reflect changes
    const updated = getPropertyById(property.id);
    if (updated) {
      setProperty(updated);
    }
  }, [property]);

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      const found = getPropertyById(params.id);
      setProperty(found);
      setIsLoading(false);
      
      // Redirect to checklist page if phase is initial-check or final-check
      if (found) {
        const phase = getPropertyRenoPhase(found);
        if (phase === "initial-check" || phase === "final-check") {
          router.replace(`/reno/construction-manager/property/${found.id}/checklist`);
        }
      }
    }
  }, [params.id, router, getPropertyRenoPhase]);

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <RenoSidebar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen overflow-hidden">
        <RenoSidebar />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Propiedad no encontrada
          </p>
          <Button onClick={() => router.push("/reno/construction-manager/kanban")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al kanban
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <RenoSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card dark:bg-[var(--prophero-gray-900)] px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/reno/construction-manager/kanban")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {property.fullAddress}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-6">
                <span>ID: {property.id}</span>
                <span>Estado: {getStageLabel(property.currentStage)}</span>
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Property Information Card - First */}
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                {getPropertyRenoPhase(property) === "initial-check" 
                  ? t.initialCheck.propertyInformation 
                  : t.upcomingSettlements.propertyInformation}
              </h2>
              
              <div className="space-y-4">
                {/* Address */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dirección completa
                  </label>
                  <div className="mt-1 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-base font-medium">{property.fullAddress}</p>
                  </div>
                </div>

                {/* Property Type */}
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo de propiedad
                  </label>
                  <p className="mt-1 text-base">{property.propertyType}</p>
                </div>

                {/* Region */}
                {property.region && (
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      Región
                    </label>
                    <p className="mt-1 text-base">{property.region}</p>
                  </div>
                )}

                {/* Real Settlement Date - Only for initial-check */}
                {getPropertyRenoPhase(property) === "initial-check" && property.realSettlementDate && (
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t.initialCheck.realSettlementDate}
                    </label>
                    <p className="mt-1 text-base">
                      {new Date(property.realSettlementDate).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {/* Estimated Visit Date - Only for initial-check */}
                {getPropertyRenoPhase(property) === "initial-check" && property.estimatedVisitDate && (
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t.initialCheck.estimatedVisitDate}
                    </label>
                    <p className="mt-1 text-base">
                      {new Date(property.estimatedVisitDate).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {/* Reno Type */}
                {property.renoType && (
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de renovación
                    </label>
                    <p className="mt-1 text-base">{property.renoType}</p>
                  </div>
                )}

                {/* Inicio y Fin Estimado */}
                {(property.inicio || property.finEst) && (
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      Fechas de obra
                    </label>
                    <div className="mt-1 space-y-1">
                      {property.inicio && (
                        <p className="text-base">
                          Inicio: {new Date(property.inicio).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                      {property.finEst && (
                        <p className="text-base">
                          Fin estimado: {new Date(property.finEst).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Editable Fields for Upcoming Settlements - Second */}
            {getPropertyRenoPhase(property) === "upcoming-settlements" && (
              <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
                <div className="space-y-6">
                  {/* Estimated Visit Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t.upcomingSettlements.estimatedVisitDate}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t.upcomingSettlements.estimatedVisitDateDescription}
                    </p>
                    <FutureDatePicker
                      value={property.estimatedVisitDate}
                      onChange={(date) => handleAutoSave({ estimatedVisitDate: date })}
                      placeholder="DD/MM/YYYY"
                      errorMessage={t.upcomingSettlements.dateMustBeFuture}
                    />
                  </div>

                  {/* Set Up Status Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t.upcomingSettlements.setupStatusNotes}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t.upcomingSettlements.setupStatusNotesDescription}
                    </p>
                    <Textarea
                      value={property.setupStatusNotes || ""}
                      onChange={(e) => handleAutoSave({ setupStatusNotes: e.target.value })}
                      placeholder={t.upcomingSettlements.setupStatusNotesPlaceholder}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Read-only notice for other phases */}
            {getPropertyRenoPhase(property) !== "upcoming-settlements" && (
              <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Esta es una vista de solo lectura. El Jefe de Obra puede ver la información pero no editarla.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStageLabel(stage: Property["currentStage"]): string {
  const labels: Record<Property["currentStage"], string> = {
    draft: "Borrador",
    review: "En revisión",
    "needs-correction": "Necesita corrección",
    negotiation: "En negociación",
    "pending-arras": "Pendiente de Arras",
    settlement: "Escrituración",
    sold: "Vendido",
    rejected: "Rechazado",
  };
  return labels[stage] || stage;
}







