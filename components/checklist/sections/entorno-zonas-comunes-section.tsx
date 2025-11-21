"use client";

import { forwardRef, useCallback } from "react";
import { ChecklistSection, ChecklistUploadZone, ChecklistQuestion } from "@/lib/checklist-storage";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "../checklist-upload-zone";
import { ChecklistQuestion as ChecklistQuestionComponent } from "../checklist-question";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

interface EntornoZonasComunesSectionProps {
  section: ChecklistSection;
  onUpdate: (updates: Partial<ChecklistSection>) => void;
  onContinue?: () => void;
}

export const EntornoZonasComunesSection = forwardRef<HTMLDivElement, EntornoZonasComunesSectionProps>(
  ({ section, onUpdate, onContinue }, ref) => {
    const { t } = useI18n();

    // Initialize upload zones if they don't exist
    const uploadZones = section.uploadZones || [
      { id: "portal", photos: [], videos: [] },
      { id: "fachada", photos: [], videos: [] },
      { id: "entorno", photos: [], videos: [] },
    ];

    // Default questions for initialization
    const defaultQuestions = [
      { id: "acceso-principal" },
      { id: "acabados" },
      { id: "comunicaciones" },
      { id: "electricidad" },
      { id: "carpinteria" },
    ];

    // Always use section.questions if available, otherwise use defaults
    const questions = section.questions || defaultQuestions;

    const handleUploadZoneUpdate = useCallback((zoneId: string, updates: ChecklistUploadZone) => {
      const currentZones = section.uploadZones || uploadZones;
      const updatedZones = currentZones.map(zone => 
        zone.id === zoneId ? updates : zone
      );
      onUpdate({ uploadZones: updatedZones });
    }, [section.uploadZones, uploadZones, onUpdate]);

    const handleQuestionUpdate = useCallback((questionId: string, updates: Partial<ChecklistQuestion>) => {
      // Always use the current section.questions, fallback to default if not present
      const currentQuestions = section.questions || defaultQuestions;
      const updatedQuestions = currentQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      onUpdate({ questions: updatedQuestions });
    }, [section.questions, defaultQuestions, onUpdate]);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {t.checklist.sections.entornoZonasComunes.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.checklist.sections.entornoZonasComunes.description}
          </p>
        </div>

        {/* Upload Zones */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <ChecklistUploadZoneComponent
              title={t.checklist.sections.entornoZonasComunes.portal}
              description={t.checklist.addPhotos}
              uploadZone={uploadZones.find(z => z.id === "portal") || { id: "portal", photos: [], videos: [] }}
              onUpdate={(updates) => handleUploadZoneUpdate("portal", updates)}
              isRequired={true}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistUploadZoneComponent
              title={t.checklist.sections.entornoZonasComunes.fachada}
              description={t.checklist.addPhotos}
              uploadZone={uploadZones.find(z => z.id === "fachada") || { id: "fachada", photos: [], videos: [] }}
              onUpdate={(updates) => handleUploadZoneUpdate("fachada", updates)}
              isRequired={true}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistUploadZoneComponent
              title={t.checklist.sections.entornoZonasComunes.entorno}
              description={t.checklist.addPhotos}
              uploadZone={uploadZones.find(z => z.id === "entorno") || { id: "entorno", photos: [], videos: [] }}
              onUpdate={(updates) => handleUploadZoneUpdate("entorno", updates)}
              isRequired={true}
            />
          </Card>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <ChecklistQuestionComponent
              question={(section.questions || questions).find(q => q.id === "acceso-principal") || { id: "acceso-principal" }}
              questionId="acceso-principal"
              label={t.checklist.sections.entornoZonasComunes.accesoPrincipal.title}
              description={t.checklist.sections.entornoZonasComunes.accesoPrincipal.description}
              onUpdate={(updates) => handleQuestionUpdate("acceso-principal", updates)}
              elements={[
                { id: "puerta-entrada", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.puertaEntrada },
                { id: "cerradura", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.cerradura },
                { id: "bombin", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.bombin },
              ]}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistQuestionComponent
              question={(section.questions || questions).find(q => q.id === "acabados") || { id: "acabados" }}
              questionId="acabados"
              label={t.checklist.sections.entornoZonasComunes.acabados.title}
              description={t.checklist.sections.entornoZonasComunes.acabados.description}
              onUpdate={(updates) => handleQuestionUpdate("acabados", updates)}
              elements={[
                { id: "paredes", label: t.checklist.sections.entornoZonasComunes.acabados.elements.paredes },
                { id: "techos", label: t.checklist.sections.entornoZonasComunes.acabados.elements.techos },
                { id: "suelo", label: t.checklist.sections.entornoZonasComunes.acabados.elements.suelo },
                { id: "rodapies", label: t.checklist.sections.entornoZonasComunes.acabados.elements.rodapies },
              ]}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistQuestionComponent
              question={(section.questions || questions).find(q => q.id === "comunicaciones") || { id: "comunicaciones" }}
              questionId="comunicaciones"
              label={t.checklist.sections.entornoZonasComunes.comunicaciones.title}
              description={t.checklist.sections.entornoZonasComunes.comunicaciones.description}
              onUpdate={(updates) => handleQuestionUpdate("comunicaciones", updates)}
              elements={[
                { id: "telefonillo", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.telefonillo },
                { id: "timbre", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.timbre },
                { id: "buzon", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.buzon },
              ]}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistQuestionComponent
              question={(section.questions || questions).find(q => q.id === "electricidad") || { id: "electricidad" }}
              questionId="electricidad"
              label={t.checklist.sections.entornoZonasComunes.electricidad.title}
              description={t.checklist.sections.entornoZonasComunes.electricidad.description}
              onUpdate={(updates) => handleQuestionUpdate("electricidad", updates)}
              elements={[
                { id: "luces", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.luces },
                { id: "interruptores", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.interruptores },
                { id: "tomas-corriente", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.tomasCorriente },
                { id: "toma-television", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.tomaTelevision },
              ]}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <ChecklistQuestionComponent
              question={(section.questions || questions).find(q => q.id === "carpinteria") || { id: "carpinteria" }}
              questionId="carpinteria"
              label={t.checklist.sections.entornoZonasComunes.carpinteria.title}
              description={t.checklist.sections.entornoZonasComunes.carpinteria.description}
              onUpdate={(updates) => handleQuestionUpdate("carpinteria", updates)}
              elements={[
                { id: "puertas-interiores", label: t.checklist.sections.entornoZonasComunes.carpinteria.elements.puertasInteriores },
              ]}
            />
          </Card>
        </div>

        {/* Navigation */}
        {onContinue && (
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {t.common.back}
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="px-4 py-2 bg-[var(--prophero-blue-500)] text-white rounded-lg hover:bg-[var(--prophero-blue-600)] transition-colors"
            >
              {t.common.continue}
            </button>
          </div>
        )}
      </div>
    );
  }
);

EntornoZonasComunesSection.displayName = "EntornoZonasComunesSection";

