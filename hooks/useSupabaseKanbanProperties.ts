"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSetUpStatusToKanbanPhase } from '@/lib/supabase/kanban-mapping';
import { matchesTechnicalConstruction } from '@/lib/supabase/user-name-utils';
import { useAppAuth } from '@/lib/auth/app-auth-context';
import type { Database } from '@/lib/supabase/types';
import type { RenoKanbanPhase } from '@/lib/reno-kanban-config';
import type { Property } from '@/lib/property-storage';

type SupabaseProperty = Database['public']['Tables']['properties']['Row'];

interface UseSupabaseKanbanPropertiesReturn {
  propertiesByPhase: Record<RenoKanbanPhase, Property[]>;
  loading: boolean;
  error: string | null;
  totalProperties: number;
}

/**
 * Converts Supabase property to Property format for kanban
 */
function convertSupabasePropertyToKanbanProperty(
  supabaseProperty: SupabaseProperty
): Property | null {
  const kanbanPhase = mapSetUpStatusToKanbanPhase(supabaseProperty['Set Up Status']);
  
  // Si no tiene un mapeo válido, retornar null para ignorarlo
  if (!kanbanPhase) return null;

  // Calcular días en etapa (simplificado - puedes mejorarlo)
  const createdAt = supabaseProperty.created_at 
    ? new Date(supabaseProperty.created_at)
    : new Date();
  const daysSinceCreation = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: supabaseProperty.id, // Keep internal ID for navigation
    fullAddress: supabaseProperty.address || supabaseProperty.name || 'Sin dirección',
    propertyType: (supabaseProperty.type as any) || 'Piso',
    currentStage: 'settlement', // Mantener para compatibilidad
    address: supabaseProperty.address || '',
    price: 0, // No hay campo de precio directo en Supabase
    analyst: supabaseProperty.team || 'CM',
    completion: undefined,
    timeInStage: daysSinceCreation === 0 ? 'Hoy' : `${daysSinceCreation} día${daysSinceCreation > 1 ? 's' : ''}`,
    timeCreated: daysSinceCreation === 0 ? 'Hoy' : `Hace ${daysSinceCreation} día${daysSinceCreation > 1 ? 's' : ''}`,
    createdAt: supabaseProperty.created_at || new Date().toISOString(),
    proximaActualizacion: supabaseProperty.next_update || undefined,
    ultimaActualizacion: supabaseProperty.last_update || undefined,
    inicio: supabaseProperty.start_date || undefined,
    finEst: supabaseProperty.estimated_end_date || undefined,
    region: supabaseProperty.area_cluster || undefined,
    renoType: supabaseProperty.renovation_type || undefined,
    renovador: supabaseProperty['Renovator name'] || undefined,
    realSettlementDate: undefined, // No hay en Supabase
    estimatedVisitDate: undefined, // No hay en Supabase
    setupStatusNotes: supabaseProperty.notes || undefined,
    // Campos adicionales de Supabase
    status: supabaseProperty.status || undefined,
    bedrooms: supabaseProperty.bedrooms || undefined,
    bathrooms: supabaseProperty.bathrooms || undefined,
    square_meters: supabaseProperty.square_meters || undefined,
    // Campo para mostrar el ID único de Engagements
    uniqueIdFromEngagements: supabaseProperty['Unique ID From Engagements'] || undefined,
  };
}

export function useSupabaseKanbanProperties() {
  const [supabaseProperties, setSupabaseProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { role, user } = useAppAuth();

  // Fetch properties from Supabase
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);

        // Build query based on user role
        let query = supabase
          .from('properties')
          .select('*');

        // Filter by role:
        // - Admin: see all properties
        // - Foreman: only see properties where "Technical construction" matches their name/email
        if (role === 'foreman' && user?.email) {
          // For foreman, we need to filter by "Technical construction"
          // Since we can't do complex matching in the query, we'll fetch all and filter client-side
          // This is not ideal for large datasets, but works for now
          query = query.select('*');
        }
        // Admin and other roles: no filter needed (fetch all)

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Apply client-side filtering for foreman
        let filteredData = data || [];
        if (role === 'foreman' && user?.email) {
          filteredData = filteredData.filter((property) => {
            const technicalConstruction = property['Technical construction'];
            return matchesTechnicalConstruction(technicalConstruction, user.email);
          });
        }

        setSupabaseProperties(filteredData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching properties');
        console.error('Error fetching properties from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have role information (or if loading is complete)
    if (role !== null || !user) {
      fetchProperties();
    }
  }, [supabase, role, user]);

  // Convert and group properties by kanban phase
  const propertiesByPhase = useMemo(() => {
    const grouped: Record<RenoKanbanPhase, Property[]> = {
      'upcoming-settlements': [],
      'initial-check': [],
      'upcoming': [],
      'reno-in-progress': [],
      'furnishing-cleaning': [],
      'final-check': [],
      'reno-fixes': [],
      'done': [],
    };

    supabaseProperties.forEach((supabaseProperty) => {
      const kanbanProperty = convertSupabasePropertyToKanbanProperty(supabaseProperty);
      if (kanbanProperty) {
        const phase = mapSetUpStatusToKanbanPhase(supabaseProperty['Set Up Status']);
        if (phase && grouped[phase]) {
          grouped[phase].push(kanbanProperty);
        }
      }
    });

    return grouped;
  }, [supabaseProperties]);

  const totalProperties = useMemo(() => {
    return Object.values(propertiesByPhase).reduce((sum, props) => sum + props.length, 0);
  }, [propertiesByPhase]);

  return {
    propertiesByPhase,
    loading,
    error,
    totalProperties,
  };
}

