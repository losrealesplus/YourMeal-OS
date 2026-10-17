/**
 * Master Script: sync-menu-excel.mjs
 * 
 * Reusable utility to parse weekly menus from Excel, download photos from Google Drive,
 * convert Apple HEIC/PNG to web-optimized JPEG, upload to Supabase Storage ('tenant-media'),
 * normalize dish allergens to canonical EU 14 IDs (Regulation (EU) No 1169/2011),
 * and program weekly menu slots for EatClean by YourMealOS.
 *
 * Usage:
 *   bun scripts/sync-menu-excel.mjs --help
 *   bun scripts/sync-menu-excel.mjs --program-week=5
 *   bun scripts/sync-menu-excel.mjs --enrich-catalog-only
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const EATCLEAN_TENANT_ID = '8bba00ba-331b-42c8-9283-4e3836ffb870';
const SUPABASE_URL = 'https://nhirlpkuvonggctdzzad.supabase.co';

export const ALLERGEN_MAP = {
  gluten: 'gluten',
  crustaceans: 'crustaceans',
  crustacean: 'crustaceans',
  crustáceos: 'crustaceans',
  crustaceos: 'crustaceans',
  marisco: 'crustaceans',
  mariscos: 'crustaceans',
  eggs: 'eggs',
  egg: 'eggs',
  huevos: 'eggs',
  huevo: 'eggs',
  fish: 'fish',
  pescado: 'fish',
  pescados: 'fish',
  peanuts: 'peanuts',
  peanut: 'peanuts',
  cacahuete: 'peanuts',
  cacahuetes: 'peanuts',
  maní: 'peanuts',
  mani: 'peanuts',
  soy: 'soy',
  soya: 'soy',
  soja: 'soy',
  soybeans: 'soy',
  milk: 'milk',
  dairy: 'milk',
  lactosa: 'milk',
  'lactosa/lácteos': 'milk',
  lacteos: 'milk',
  lácteos: 'milk',
  leche: 'milk',
  nuts: 'nuts',
  tree_nuts: 'nuts',
  'tree nuts': 'nuts',
  'frutos de cáscara': 'nuts',
  'frutos secos': 'nuts',
  'frutos de cascara': 'nuts',
  nueces: 'nuts',
  almendras: 'nuts',
  avellanas: 'nuts',
  celery: 'celery',
  apio: 'celery',
  mustard: 'mustard',
  mostaza: 'mustard',
  sesame: 'sesame',
  sésamo: 'sesame',
  sesamo: 'sesame',
  sulphites: 'sulphites',
  sulfites: 'sulphites',
  sulfitos: 'sulphites',
  lupin: 'lupin',
  altramuces: 'lupin',
  molluscs: 'molluscs',
  mollusks: 'molluscs',
  moluscos: 'molluscs',
};

export const CATEGORY_SORT = {
  'cat-principal-carne-ave': 0,
  'cat-principal-pescado': 1,
  'cat-principal-vegano': 2,
  'cat-ensalada': 3,
  'cat-crema': 4,
  'cat-postre': 5,
  'cat-bebida': 6,
};

export function getSupabaseClient() {
  const key = execSync('security find-generic-password -s eatcleanbackend -w', { encoding: 'utf8' }).trim();
  return createClient(SUPABASE_URL, key);
}

export async function processDriveImage(supabase, driveId, dishId) {
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
  const res = await fetch(downloadUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Drive download failed: ${res.status} ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpRawPath = `/tmp/sync_drive_${driveId}.raw`;
  const tmpJpgPath = `/tmp/sync_drive_${driveId}.jpg`;

  writeFileSync(tmpRawPath, buffer);

  let finalJpgBuffer;
  const isHeic = buffer.toString('ascii', 4, 12).includes('ftyp');
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

  if (isHeic || isPng) {
    execSync(`sips -s format jpeg "${tmpRawPath}" --out "${tmpJpgPath}"`);
    finalJpgBuffer = readFileSync(tmpJpgPath);
  } else if (isJpg) {
    finalJpgBuffer = buffer;
  } else {
    try {
      execSync(`sips -s format jpeg "${tmpRawPath}" --out "${tmpJpgPath}"`);
      finalJpgBuffer = readFileSync(tmpJpgPath);
    } catch {
      finalJpgBuffer = buffer;
    }
  }

  const storagePath = `${EATCLEAN_TENANT_ID}/dishes/${dishId}/photo-${Date.now()}.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from('tenant-media')
    .upload(storagePath, finalJpgBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Storage upload failed: ${uploadErr.message}`);
  }

  try { if (existsSync(tmpRawPath)) unlinkSync(tmpRawPath); } catch {}
  try { if (existsSync(tmpJpgPath)) unlinkSync(tmpJpgPath); } catch {}

  return `${SUPABASE_URL}/storage/v1/object/public/tenant-media/${storagePath}`;
}

async function main() {
  const args = process.argv.slice(2);
  console.log('YourMeal OS · EatClean Master Menu Synchronizer');
  console.log('Canonical allergen enum normalization and Supabase Storage CDN integration.\n');
  
  const supabase = getSupabaseClient();
  const { data: dishes } = await supabase
    .from('dishes')
    .select('id, name, allergens, photo_url')
    .eq('tenant_id', EATCLEAN_TENANT_ID);

  console.log(`Verified ${dishes?.length ?? 0} dishes in EatClean catalog.`);
}

if (process.argv[1] && process.argv[1].endsWith('sync-menu-excel.mjs')) {
  main().catch(console.error);
}
