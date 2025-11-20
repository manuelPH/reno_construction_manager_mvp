"use client";

import { useState, useMemo, useCallback } from 'react';
import { Trash2, Save, Send, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useDynamicCategories } from '@/hooks/useDynamicCategories';
import { SendUpdateDialog } from './send-update-dialog';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/types';

type SupabaseProperty = Database['public']['Tables']['properties']['Row'];

interface DynamicCategoriesProgressProps {
  property: SupabaseProperty;
}

// Format activities text to add line breaks for lists
function formatActivitiesText(text: string): string {
  if (!text) return '';
  
  // Pattern to detect list items: numbers followed by dot, dash, or parentheses
  // Examples: "2.1", "2.2", "-", "•", etc.
  let formatted = text;
  
  // Add line break before list items (numbered like "2.1", "2.2", etc.)
  // Match patterns like "2.1", "2.2", etc. that appear after text
  formatted = formatted.replace(/([^\n])(\n?)(\d+\.\d+\s)/g, (match, before, existingBreak, listItem) => {
    // If there's already a break, keep it; otherwise add one
    return existingBreak ? match : `${before}\n${listItem}`;
  });
  
  // Ensure double line breaks between major sections (e.g., "2.1" followed by "2.2")
  formatted = formatted.replace(/(\d+\.\d+[^\n]*)\n(\d+\.\d+)/g, '$1\n\n$2');
  
  return formatted;
}

export function DynamicCategoriesProgress({ property }: DynamicCategoriesProgressProps) {
  const { categories, loading, saveAllProgress, deleteCategory } = useDynamicCategories(property.id);
  const [localPercentages, setLocalPercentages] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);

  // Initialize local percentages from categories
  useMemo(() => {
    const initial: Record<string, number> = {};
    categories.forEach(cat => {
      initial[cat.id] = cat.percentage ?? 0;
    });
    setLocalPercentages(initial);
    setHasUnsavedChanges(false);
  }, [categories]);

  // Calculate global progress (average of all categories)
  const globalProgress = useMemo(() => {
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, cat) => {
      const percentage = localPercentages[cat.id] ?? cat.percentage ?? 0;
      return sum + percentage;
    }, 0);
    return Math.round(total / categories.length);
  }, [categories, localPercentages]);

  const handleSliderChange = useCallback((categoryId: string, value: number) => {
    setLocalPercentages(prev => ({
      ...prev,
      [categoryId]: value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    const success = await saveAllProgress(property.id, localPercentages);
    if (success) {
      setHasUnsavedChanges(false);
    }
  }, [property.id, localPercentages, saveAllProgress]);

  const handleDelete = useCallback(async (categoryId: string) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta categoría?');
    if (confirmed) {
      await deleteCategory(categoryId);
      // Remove from local state
      setLocalPercentages(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
    }
  }, [deleteCategory]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No definida';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
        <p className="text-muted-foreground">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Progreso de Obras</h2>
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Cambios sin guardar
            </span>
          )}
        </div>

        {/* Información General - Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha de inicio</p>
              <p className="text-sm font-medium">{formatDate(property.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha estimada de finalización</p>
              <p className="text-sm font-medium">{formatDate(property.estimated_end_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Última actualización</p>
              <p className="text-sm font-medium">{formatDate(property.last_update)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Próxima actualización</p>
              <p className="text-sm font-medium">{formatDate(property.next_update)}</p>
            </div>
          </div>
        </div>

        {/* Progreso Global */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Progreso General</Label>
            <span className="text-lg font-bold">{globalProgress}%</span>
          </div>
          <Progress value={globalProgress} className="h-3" />
        </div>

        {/* Lista de Categorías */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Categorías</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay categorías definidas</p>
          ) : (
            categories.map((category) => {
              const percentage = localPercentages[category.id] ?? category.percentage ?? 0;
              return (
                <div
                  key={category.id}
                  className="p-4 border rounded-lg space-y-3 bg-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{category.category_name}</h3>
                      {category.activities_text && (
                        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                          {formatActivitiesText(category.activities_text)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Progreso</Label>
                      <span className="text-sm font-semibold">{percentage}%</span>
                    </div>
                    {/* Slider with blue background and visible thumb */}
                    <div className="relative h-3">
                      {/* Background track (full width, blue) */}
                      <div className="absolute inset-0 h-3 rounded-lg bg-[var(--prophero-blue-100)] dark:bg-[var(--prophero-blue-900)]" />
                      {/* Progress fill (blue primary) */}
                      <div 
                        className="absolute inset-y-0 left-0 rounded-l-lg bg-primary"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                      {/* Slider input on top - transparent track, only thumb visible */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => handleSliderChange(category.id, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-3 rounded-lg appearance-none cursor-pointer slider-blue z-10"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Progreso
          </Button>
          <Button
            variant="outline"
            onClick={() => setSendUpdateOpen(true)}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar Update a Cliente
          </Button>
        </div>
      </div>

      <SendUpdateDialog
        open={sendUpdateOpen}
        onOpenChange={setSendUpdateOpen}
        property={property}
        categories={categories.map(cat => ({
          id: cat.id,
          name: cat.category_name,
          percentage: localPercentages[cat.id] ?? cat.percentage ?? 0,
        }))}
      />
    </>
  );
}

