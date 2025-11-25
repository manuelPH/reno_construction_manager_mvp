#!/usr/bin/env tsx
/**
 * Script para sincronizar propiedades de Reno In Progress desde Airtable
 * Usa la view viwQUOrLzUrScuU4k que contiene propiedades en fase Reno In Progress
 * Uso: npm run sync:reno-in-progress
 */

// Cargar variables de entorno desde .env.local manualmente
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('⚠️  No se pudo cargar .env.local, usando variables de entorno del sistema');
}

import { syncRenoInProgressFromAirtable } from '../lib/airtable/sync-reno-in-progress';

async function main() {
  console.log('🔄 Iniciando sincronización de Reno In Progress desde Airtable...\n');

  // Verificar variables de entorno
  const requiredEnvVars = [
    'NEXT_PUBLIC_AIRTABLE_API_KEY',
    'NEXT_PUBLIC_AIRTABLE_BASE_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('❌ Faltan variables de entorno:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  try {
    const result = await syncRenoInProgressFromAirtable();

    console.log('\n✅ Sincronización completada!\n');
    console.log('📊 Resumen:');
    console.log(`   - Creadas: ${result.created}`);
    console.log(`   - Actualizadas: ${result.updated}`);
    console.log(`   - Errores: ${result.errors}\n`);

    if (result.details.length > 0) {
      console.log('📝 Detalles (primeros 20):');
      result.details.slice(0, 20).forEach((detail) => console.log(`   ${detail}`));
      if (result.details.length > 20) {
        console.log(`   ... y ${result.details.length - 20} más`);
      }
    }

    if (result.errors > 0) {
      console.log('\n⚠️  Hay errores. Revisa los detalles arriba.');
      process.exit(1);
    }

    console.log('\n✅ Todas las propiedades de Reno In Progress han sido sincronizadas correctamente.');
  } catch (error: any) {
    console.error('\n❌ Error durante la sincronización:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

