"use client";

import { Wrench, Calendar } from "lucide-react";
import { Property } from "@/lib/property-storage";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PropertyCommentsSection } from "@/components/reno/property-comments-section";

interface PropertyActionTabProps {
  property: Property;
  supabaseProperty?: any;
  propertyId?: string | null;
}

/**
 * PropertyActionTab Component
 * 
 * Página de "Acción/Ejecución" - Muestra información sobre la ejecución de obras
 * y acciones pendientes o en curso
 */
export function PropertyActionTab({
  property,
  supabaseProperty,
  propertyId,
}: PropertyActionTabProps) {
  const { t } = useI18n();

  const renoPhase = supabaseProperty?.reno_phase || "upcoming-settlements";
  const nextRenoSteps = supabaseProperty?.next_reno_steps;
  const estimatedVisitDate = supabaseProperty?.['Estimated Visit Date'];
  const technicalConstructor = supabaseProperty?.['Technical construction'] || supabaseProperty?.technical_construction;
  const responsibleOwner = supabaseProperty?.responsible_owner;

  return (
    <div className="space-y-6">
      {/* Mostrar fecha estimada solo si no está en sidebar o si necesita edición */}
      {estimatedVisitDate && renoPhase !== "upcoming-settlements" && (
        <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fecha Estimada de Visita
          </h3>
          <p className="text-sm text-foreground">
            {new Date(estimatedVisitDate).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}

