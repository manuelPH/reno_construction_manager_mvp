/**
 * Script para migrar propiedades de upcoming-settlements a initial-check
 * y crear visitas en el calendario para propiedades que ya tienen fecha
 * 
 * Ejecutar con: npm run migrate:upcoming-to-initial-check
 */

import { createAdminClient } from '../lib/supabase/admin';
import { findRecordByPropertyId, updateAirtableWithRetry } from '../lib/airtable/client';

async function migrateUpcomingToInitialCheck() {
  console.log('🚀 Starting migration: Upcoming Settlements → Initial Check\n');
  
  const supabase = createAdminClient();
  const tableName = process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME || 'Properties';
  
  try {
    // 1. Buscar todas las propiedades en upcoming-settlements que tengan Estimated Visit Date
    console.log('📋 Step 1: Finding properties in upcoming-settlements with Estimated Visit Date...');
    
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, "Estimated Visit Date", airtable_property_id, "Unique ID From Engagements", "Set Up Status"')
      .eq('reno_phase', 'upcoming-settlements')
      .not('Estimated Visit Date', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching properties:', fetchError);
      return;
    }
    
    if (!properties || properties.length === 0) {
      console.log('✅ No properties found to migrate');
      return;
    }
    
    console.log(`✅ Found ${properties.length} properties with Estimated Visit Date\n`);
    
    let updatedCount = 0;
    let visitCreatedCount = 0;
    let visitSkippedCount = 0;
    let airtableUpdatedCount = 0;
    let errors: string[] = [];
    
    // 2. Para cada propiedad:
    for (const property of properties) {
      const propertyId = property.id;
      const estimatedVisitDate = property['Estimated Visit Date'] as string;
      const airtablePropertyId = property.airtable_property_id || property['Unique ID From Engagements'];
      
      console.log(`\n📦 Processing property: ${propertyId}`);
      console.log(`   Estimated Visit Date: ${estimatedVisitDate}`);
      
      try {
        // 2a. Verificar si ya existe una visita para esta fecha
        const visitDate = new Date(estimatedVisitDate);
        visitDate.setHours(9, 0, 0, 0); // Set to 9 AM
        
        const { data: existingVisits } = await supabase
          .from('property_visits')
          .select('id')
          .eq('property_id', propertyId)
          .eq('visit_type', 'initial-check')
          .gte('visit_date', new Date(visitDate.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .lte('visit_date', new Date(visitDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
          .limit(1);
        
        // 2b. Crear visita si no existe
        if (!existingVisits || existingVisits.length === 0) {
          const { error: visitError } = await supabase
            .from('property_visits')
            .insert({
              property_id: propertyId,
              visit_date: visitDate.toISOString(),
              visit_type: 'initial-check',
              notes: null,
            });
          
          if (visitError) {
            console.error(`   ❌ Error creating visit:`, visitError);
            errors.push(`${propertyId}: Visit creation failed - ${visitError.message}`);
          } else {
            console.log(`   ✅ Created visit for ${visitDate.toISOString()}`);
            visitCreatedCount++;
          }
        } else {
          console.log(`   ℹ️  Visit already exists, skipping`);
          visitSkippedCount++;
        }
        
        // 2c. Actualizar Set Up Status a 'initial check' en Supabase
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            'Set Up Status': 'initial check',
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);
        
        if (updateError) {
          console.error(`   ❌ Error updating property phase:`, updateError);
          errors.push(`${propertyId}: Phase update failed - ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated Set Up Status to 'initial check'`);
          updatedCount++;
        }
        
        // 2d. Actualizar Airtable si tiene airtable_property_id
        if (airtablePropertyId) {
          try {
            const recordId = await findRecordByPropertyId(tableName, airtablePropertyId);
            if (recordId) {
              const airtableSuccess = await updateAirtableWithRetry(tableName, recordId, {
                'Set Up Status': 'Initial Check',
                'fldIhqPOAFL52MMBn': estimatedVisitDate, // Estimated visit date
              });
              
              if (airtableSuccess) {
                console.log(`   ✅ Updated Airtable`);
                airtableUpdatedCount++;
              } else {
                console.warn(`   ⚠️  Failed to update Airtable`);
                errors.push(`${propertyId}: Airtable update failed`);
              }
            } else {
              console.warn(`   ⚠️  Airtable record not found for ${airtablePropertyId}`);
              errors.push(`${propertyId}: Airtable record not found`);
            }
          } catch (airtableError) {
            console.error(`   ❌ Error updating Airtable:`, airtableError);
            errors.push(`${propertyId}: Airtable error - ${airtableError}`);
          }
        } else {
          console.warn(`   ⚠️  No Airtable ID found, skipping Airtable update`);
        }
        
      } catch (error: any) {
        console.error(`   ❌ Error processing property ${propertyId}:`, error);
        errors.push(`${propertyId}: ${error.message || error}`);
      }
    }
    
    // 3. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Properties updated: ${updatedCount}/${properties.length}`);
    console.log(`✅ Visits created: ${visitCreatedCount}`);
    console.log(`ℹ️  Visits skipped (already exist): ${visitSkippedCount}`);
    console.log(`✅ Airtable records updated: ${airtableUpdatedCount}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ Migration completed!\n');
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateUpcomingToInitialCheck()
  .then(() => {
    console.log('✨ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

