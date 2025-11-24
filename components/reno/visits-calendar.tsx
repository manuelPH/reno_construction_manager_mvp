"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, MessageSquare, Plus, CheckCircle2, Wrench, Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/property/datetime-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RenoKanbanPhase } from "@/lib/reno-kanban-config";
import { Property } from "@/lib/property-storage";

interface CalendarVisit {
  id: string;
  property_id: string;
  visit_date: string;
  visit_type: "initial-check" | "final-check" | "obra-seguimiento" | "reminder";
  notes: string | null;
  created_by: string | null;
  property_address?: string;
  property?: Property;
  last_comment?: string;
}

interface VisitsCalendarProps {
  propertiesByPhase?: Record<RenoKanbanPhase, Property[]>;
  onPropertyClick?: (propertyId: string) => void;
}

// Fases que permiten agendar cada tipo de visita
const INITIAL_CHECK_PHASES: RenoKanbanPhase[] = ["initial-check"];
const FINAL_CHECK_PHASES: RenoKanbanPhase[] = ["final-check"];
const OBRA_SEGUIMIENTO_PHASES: RenoKanbanPhase[] = ["reno-in-progress"];

export function VisitsCalendar({
  propertiesByPhase,
  onPropertyClick,
}: VisitsCalendarProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [visits, setVisits] = useState<CalendarVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [visitType, setVisitType] = useState<"initial-check" | "final-check" | "obra-seguimiento" | "reminder">("initial-check");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [visitDate, setVisitDate] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navegación de fechas
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtener rango de fechas según el modo de vista
  const getDateRange = useCallback(() => {
    if (viewMode === "day") {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      // Semana: desde el lunes hasta el domingo
      const start = new Date(currentDate);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar al lunes
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }, [currentDate, viewMode]);

  // Cargar visitas y obtener último comentario
  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from("property_visits")
        .select(`
          *,
          properties:property_id (
            address,
            id
          )
        `)
        .gte("visit_date", start.toISOString())
        .lte("visit_date", end.toISOString())
        .order("visit_date", { ascending: true });

      if (error) {
        console.error("Error fetching visits:", error);
        return;
      }

      // Obtener último comentario para cada propiedad
      const visitsWithComments = await Promise.all(
        (data || []).map(async (visit: any) => {
          const { data: comments } = await supabase
            .from("property_comments")
            .select("comment_text, created_at")
            .eq("property_id", visit.property_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...visit,
            property_address: visit.properties?.address || null,
            last_comment: comments?.comment_text || null,
          };
        })
      );

      setVisits(visitsWithComments);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, supabase]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Obtener propiedades disponibles según el tipo de visita
  const getAvailableProperties = useMemo(() => {
    if (!propertiesByPhase) return [];

    switch (visitType) {
      case "initial-check":
        return propertiesByPhase["initial-check"] || [];
      case "final-check":
        return propertiesByPhase["final-check"] || [];
      case "obra-seguimiento":
        return propertiesByPhase["reno-in-progress"] || [];
      case "reminder":
        // Recordatorios: todas las propiedades asignadas al rol del usuario
        const allProperties: Property[] = [];
        Object.values(propertiesByPhase).forEach((phaseProperties) => {
          allProperties.push(...phaseProperties);
        });
        return allProperties;
      default:
        return [];
    }
  }, [visitType, propertiesByPhase]);

  // Crear nueva visita
  const handleCreateVisit = async () => {
    if (!selectedPropertyId || !visitDate) {
      toast.error("Debes seleccionar una propiedad y una fecha");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("property_visits").insert({
        property_id: selectedPropertyId,
        visit_date: visitDate,
        visit_type: visitType,
        notes: notes.trim() || null,
      });

      if (error) {
        throw error;
      }

      toast.success(
        visitType === "reminder"
          ? "Recordatorio creado correctamente"
          : "Visita creada correctamente"
      );
      setSelectedPropertyId("");
      setVisitDate(undefined);
      setNotes("");
      setIsCreateDialogOpen(false);
      await fetchVisits();
    } catch (error: any) {
      console.error("Error creating visit:", error);
      toast.error("Error al crear la visita");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener icono según tipo de visita
  const getVisitIcon = (type: string) => {
    switch (type) {
      case "initial-check":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "final-check":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "obra-seguimiento":
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case "reminder":
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Obtener etiqueta según tipo de visita
  const getVisitLabel = (type: string) => {
    switch (type) {
      case "initial-check":
        return "Check Inicial";
      case "final-check":
        return "Check Final";
      case "obra-seguimiento":
        return "Seguimiento Obra";
      case "reminder":
        return "Recordatorio";
      default:
        return "Visita";
    }
  };

  // Agrupar visitas por hora (para vista diaria) o por día (para vista semanal)
  const groupedVisits = useMemo(() => {
    if (viewMode === "day") {
      // Agrupar por hora
      const grouped: Record<number, CalendarVisit[]> = {};
      visits.forEach((visit) => {
        const hour = new Date(visit.visit_date).getHours();
        if (!grouped[hour]) grouped[hour] = [];
        grouped[hour].push(visit);
      });
      return grouped;
    } else {
      // Agrupar por día de la semana
      const grouped: Record<number, CalendarVisit[]> = {};
      visits.forEach((visit) => {
        const date = new Date(visit.visit_date);
        const dayOfWeek = date.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes = 0, Domingo = 6
        if (!grouped[adjustedDay]) grouped[adjustedDay] = [];
        grouped[adjustedDay].push(visit);
      });
      return grouped;
    }
  }, [visits, viewMode]);

  // Generar horas del día (para vista diaria) - solo de 8:00 AM a 20:00 PM
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8, 9, 10, ..., 20

  // Generar días de la semana (para vista semanal)
  const weekDays = useMemo(() => {
    const { start } = getDateRange();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [getDateRange]);

  return (
    <Card className="bg-card dark:bg-[var(--prophero-gray-900)] col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Calendario de Visitas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist inicial, final y seguimiento de obra
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="flex gap-1 border rounded-md">
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Semana
            </button>
          </div>
          
          {/* Navegación */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPeriod}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPeriod}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Botón crear */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {visitType === "reminder" ? "Crear Recordatorio" : "Crear Visita"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Tipo selector */}
                <div className="space-y-2">
                  <Label>Tipo de Visita</Label>
                  <Select
                    value={visitType}
                    onValueChange={(value: "initial-check" | "final-check" | "obra-seguimiento" | "reminder") =>
                      setVisitType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial-check">Check Inicial</SelectItem>
                      <SelectItem value="final-check">Check Final</SelectItem>
                      <SelectItem value="obra-seguimiento">Seguimiento de Obra</SelectItem>
                      <SelectItem value="reminder">Recordatorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property selector */}
                <div className="space-y-2">
                  <Label>Propiedad</Label>
                  <Select
                    value={selectedPropertyId}
                    onValueChange={setSelectedPropertyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableProperties.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {visitType === "reminder"
                            ? "No hay propiedades asignadas a tu rol"
                            : "No hay propiedades disponibles para este tipo de visita"}
                        </div>
                      ) : (
                        getAvailableProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.fullAddress || property.address || property.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date picker */}
                <div className="space-y-2">
                  <Label>Fecha y hora</Label>
                  <DateTimePicker
                    value={visitDate}
                    onChange={setVisitDate}
                    placeholder="DD/MM/YYYY HH:mm"
                    errorMessage="La fecha y hora deben ser futuras"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agregar notas sobre la visita..."
                    rows={3}
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateVisit}
                    disabled={!selectedPropertyId || !visitDate || isSubmitting}
                  >
                    {isSubmitting ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Cargando...
          </p>
        ) : viewMode === "day" ? (
          // Vista diaria por horas
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {hours.map((hour) => {
              const hourVisits = groupedVisits[hour] || [];
              return (
                <div key={hour} className="flex gap-4 border-b pb-2">
                  <div className="w-16 text-sm font-medium text-muted-foreground">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {hourVisits.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Sin visitas</span>
                    ) : (
                      hourVisits.map((visit) => (
                        <button
                          key={visit.id}
                          onClick={() => setSelectedVisit(visit)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors text-left"
                        >
                          {getVisitIcon(visit.visit_type)}
                          <span className="text-xs font-medium">
                            {visit.property_address || visit.property_id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getVisitLabel(visit.visit_type)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Vista semanal por días
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const dayVisits = groupedVisits[index] || [];
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-2 min-h-[200px]",
                    isToday && "border-primary bg-primary/5"
                  )}
                >
                  <div className="text-xs font-medium mb-2">
                    {day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
                  </div>
                  <div className="space-y-1">
                    {dayVisits.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Sin visitas</span>
                    ) : (
                      dayVisits.map((visit) => (
                        <button
                          key={visit.id}
                          onClick={() => setSelectedVisit(visit)}
                          className="w-full flex items-start gap-1.5 px-2 py-1 rounded text-xs border bg-card hover:bg-accent transition-colors text-left"
                        >
                          {getVisitIcon(visit.visit_type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {visit.property_address || visit.property_id}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(visit.visit_date).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                              {getVisitLabel(visit.visit_type)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de detalles */}
        {selectedVisit && (
          <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getVisitIcon(selectedVisit.visit_type)}
                  {getVisitLabel(selectedVisit.visit_type)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVisit.property_address || selectedVisit.property_id}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha y hora</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedVisit.visit_date)}</span>
                  </div>
                </div>

                {selectedVisit.last_comment && (
                  <div className="space-y-2">
                    <Label>Último comentario</Label>
                    <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-md">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="flex-1">{selectedVisit.last_comment}</span>
                    </div>
                  </div>
                )}

                {selectedVisit.notes && (
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <div className="text-sm bg-muted p-3 rounded-md">
                      {selectedVisit.notes}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVisit(null)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      if (onPropertyClick) {
                        onPropertyClick(selectedVisit.property_id);
                      }
                      setSelectedVisit(null);
                    }}
                  >
                    Ir a la tarea
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

