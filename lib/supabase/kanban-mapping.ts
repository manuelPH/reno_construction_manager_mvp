import { RenoKanbanPhase } from '@/lib/reno-kanban-config';

/**
 * Maps Supabase "Set Up Status" values to Reno Kanban phases
 */
export function mapSetUpStatusToKanbanPhase(setUpStatus: string | null): RenoKanbanPhase | null {
  if (!setUpStatus) return null;

  const status = setUpStatus.trim().toLowerCase();

  // Mapeo de valores de "Set Up Status" a columnas del kanban
  const mapping: Record<string, RenoKanbanPhase> = {
    // Nuevas escrituras → upcoming-settlements
    'pending to visit': 'upcoming-settlements',
    'nuevas escrituras': 'upcoming-settlements',
    
    // Check Inicial → initial-check
    'check inicial': 'initial-check',
    'initial check': 'initial-check',
    
    // Proximas propiedades → upcoming
    'pending to validate budget': 'upcoming',
    'reno to start': 'upcoming',
    'proximas propiedades': 'upcoming',
    'pending to validate budget & reno to start': 'upcoming',
    
    // Obras en proceso → reno-in-progress
    'reno in progress': 'reno-in-progress',
    'obras en proceso': 'reno-in-progress',
    
    // Limpieza y amoblamiento → furnishing-cleaning
    'cleaning & furnishing': 'furnishing-cleaning',
    'limpieza y amoblamiento': 'furnishing-cleaning',
    'cleaning and furnishing': 'furnishing-cleaning',
    
    // Check final → final-check
    'final check': 'final-check',
    'check final': 'final-check',
    
    // TODO: Agregar mapeos para reno-fixes y done cuando se definan
    // 'reno fixes': 'reno-fixes',
    // 'done': 'done',
    // 'completed': 'done',
  };

  // Buscar coincidencia exacta o parcial
  for (const [key, phase] of Object.entries(mapping)) {
    if (status === key || status.includes(key) || key.includes(status)) {
      return phase;
    }
  }

  // Si no hay coincidencia, retornar null para que se ignore
  return null;
}

/**
 * Gets all valid kanban phases that have a mapping
 */
export function getMappedKanbanPhases(): RenoKanbanPhase[] {
  return [
    'upcoming-settlements',
    'initial-check',
    'upcoming',
    'reno-in-progress',
    'furnishing-cleaning',
    'final-check',
    // 'reno-fixes', // TODO: Agregar cuando se defina el mapeo
    // 'done', // TODO: Agregar cuando se defina el mapeo
  ];
}

