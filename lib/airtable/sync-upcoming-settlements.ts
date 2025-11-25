/**
 * Sincronización desde Airtable hacia Supabase para la fase Upcoming Settlements
 * Usa la view específica viwpYQ0hsSSdFrSD1 que contiene propiedades con
 * Set Up Status == "Pending to visit" (propiedades próximas a escrituración)
 */

import { syncPropertiesFromAirtable } from './sync-from-airtable';
import { createAdminClient } from '@/lib/supabase/admin';

const AIRTABLE_TABLE_ID = 'tblmX19OTsj3cTHmA';
const AIRTABLE_VIEW_ID_UPCOMING_SETTLEMENTS = 'viwpYQ0hsSSdFrSD1';

/**
 * Sincroniza propiedades de Upcoming Settlements desde Airtable
 * Esta función sincroniza propiedades con Set Up Status == "Pending to visit"
 * (propiedades próximas a escrituración)
 * Fuerza reno_phase a 'upcoming-settlements' para todas las propiedades de esta view
 */
export async function syncUpcomingSettlementsFromAirtable(): Promise<{
  created: number;
  updated: number;
  errors: number;
  details: string[];
}> {
  console.log('[Upcoming Settlements Sync] Starting sync for Upcoming Settlements phase...');
  console.log(`[Upcoming Settlements Sync] Using view: ${AIRTABLE_VIEW_ID_UPCOMING_SETTLEMENTS}`);
  
  const result = await syncPropertiesFromAirtable(
    AIRTABLE_TABLE_ID,
    AIRTABLE_VIEW_ID_UPCOMING_SETTLEMENTS
  );
  
  // Después de sincronizar, forzar reno_phase a 'upcoming-settlements' para todas las propiedades de esta view
  const supabase = createAdminClient();
  
  try {
    // Obtener todas las propiedades que fueron sincronizadas (basado en los detalles)
    const propertyIds = result.details
      .filter(detail => detail.startsWith('Updated:') || detail.startsWith('Created:'))
      .map(detail => {
        const match = detail.match(/^(Updated|Created):\s+([A-Z0-9-]+)/);
        return match ? match[2] : null;
      })
      .filter(Boolean) as string[];

    if (propertyIds.length > 0) {
      console.log(`[Upcoming Settlements Sync] Forcing reno_phase to 'upcoming-settlements' for ${propertyIds.length} properties...`);
      
      // Actualizar todas las propiedades sincronizadas a fase 'upcoming-settlements'
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          reno_phase: 'upcoming-settlements',
          updated_at: new Date().toISOString()
        })
        .in('id', propertyIds);

      if (updateError) {
        console.error('[Upcoming Settlements Sync] Error updating reno_phase:', updateError);
      } else {
        console.log(`[Upcoming Settlements Sync] ✅ Successfully set reno_phase to 'upcoming-settlements' for ${propertyIds.length} properties`);
      }

      // Limpiar propiedades que ya no están en esta view pero estaban en fase 'upcoming-settlements'
      // Obtener todas las propiedades que están en fase 'upcoming-settlements' pero no están en la lista sincronizada
      const { data: allUpcomingSettlementsProperties, error: fetchError } = await supabase
        .from('properties')
        .select('id, airtable_property_id')
        .eq('reno_phase', 'upcoming-settlements');

      if (fetchError) {
        console.error('[Upcoming Settlements Sync] Error fetching existing upcoming-settlements properties:', fetchError);
      } else {
        // Obtener los airtable_property_id de las propiedades sincronizadas
        const { data: syncedProperties } = await supabase
          .from('properties')
          .select('airtable_property_id')
          .in('id', propertyIds);

        const syncedAirtableIds = new Set(
          syncedProperties?.map(p => p.airtable_property_id).filter(Boolean) || []
        );

        // Encontrar propiedades que están en 'upcoming-settlements' pero no están en la view sincronizada
        const propertiesToRemove = allUpcomingSettlementsProperties?.filter(
          p => p.airtable_property_id && !syncedAirtableIds.has(p.airtable_property_id)
        ) || [];

        if (propertiesToRemove.length > 0) {
          console.log(`[Upcoming Settlements Sync] Found ${propertiesToRemove.length} properties to remove from 'upcoming-settlements' phase (no longer in view)`);
          // No las eliminamos, solo las movemos a otra fase o las dejamos como están
          // Por ahora solo logueamos para debugging
          console.log('[Upcoming Settlements Sync] Properties to review:', propertiesToRemove.map(p => p.id));
        }
      }
    }
  } catch (error) {
    console.error('[Upcoming Settlements Sync] Error forcing reno_phase:', error);
  }
  
  console.log('[Upcoming Settlements Sync] Sync completed:', {
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  });
  
  return result;
}


