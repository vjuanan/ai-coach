const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function ensureGymClientPerGymProfile() {
  const { data: gymProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'gym');

  if (error) throw new Error(`Error fetching gym profiles: ${error.message}`);

  let created = 0;
  let updated = 0;

  for (const profile of gymProfiles || []) {
    const { data: userClients, error: userClientsError } = await supabase
      .from('clients')
      .select('id, type, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (userClientsError) {
      throw new Error(`Error fetching clients for ${profile.id}: ${userClientsError.message}`);
    }

    if (!userClients || userClients.length === 0) {
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: profile.id,
          coach_id: null,
          type: 'gym',
          name: profile.full_name || profile.email || 'Gym',
          email: profile.email,
          details: {
            source: 'backfill-athlete-hierarchy',
            auto_created: true,
            created_at: new Date().toISOString(),
          },
        });

      if (insertError) throw new Error(`Error creating gym client for ${profile.id}: ${insertError.message}`);
      created += 1;
      continue;
    }

    // Keep rows linked to this user as gym-type so user experience stays coherent.
    const { error: updateTypeError } = await supabase
      .from('clients')
      .update({ type: 'gym', name: profile.full_name || profile.email || 'Gym', email: profile.email })
      .eq('user_id', profile.id);

    if (updateTypeError) throw new Error(`Error updating client type for ${profile.id}: ${updateTypeError.message}`);
    updated += 1;
  }

  return { created, updated, totalProfiles: gymProfiles?.length || 0 };
}

async function normalizeCoachIdsToProfileIds() {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, coach_id')
    .not('coach_id', 'is', null);

  if (error) throw new Error(`Error fetching coach_id references: ${error.message}`);

  const coachIds = [...new Set((clients || []).map((row) => row.coach_id).filter(Boolean))];
  if (coachIds.length === 0) return { normalizedLegacy: 0, nulledInvalid: 0 };

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .in('id', coachIds);

  if (profilesError) throw new Error(`Error fetching profile ids: ${profilesError.message}`);

  const validProfileIds = new Set((profiles || []).map((p) => p.id));

  const unknownIds = coachIds.filter((id) => !validProfileIds.has(id));
  if (unknownIds.length === 0) return { normalizedLegacy: 0, nulledInvalid: 0 };

  const { data: legacyCoaches, error: legacyError } = await supabase
    .from('coaches')
    .select('id, user_id')
    .in('id', unknownIds);

  if (legacyError) throw new Error(`Error fetching legacy coaches: ${legacyError.message}`);

  const legacyMap = new Map((legacyCoaches || []).map((row) => [row.id, row.user_id]));

  let normalizedLegacy = 0;
  let nulledInvalid = 0;

  for (const oldCoachId of unknownIds) {
    const mappedProfileId = legacyMap.get(oldCoachId);

    if (mappedProfileId) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ coach_id: mappedProfileId })
        .eq('coach_id', oldCoachId);

      if (updateError) throw new Error(`Error remapping legacy coach_id ${oldCoachId}: ${updateError.message}`);
      normalizedLegacy += 1;
    } else {
      const { error: nullError } = await supabase
        .from('clients')
        .update({ coach_id: null })
        .eq('coach_id', oldCoachId);

      if (nullError) throw new Error(`Error nulling invalid coach_id ${oldCoachId}: ${nullError.message}`);
      nulledInvalid += 1;
    }
  }

  return { normalizedLegacy, nulledInvalid };
}

async function enforceOneGymPerCoach() {
  const { data: gymClients, error } = await supabase
    .from('clients')
    .select('id, coach_id, created_at, updated_at')
    .eq('type', 'gym')
    .not('coach_id', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Error fetching gym clients for uniqueness: ${error.message}`);

  const byCoach = new Map();
  for (const gym of gymClients || []) {
    const coachId = gym.coach_id;
    if (!coachId) continue;
    if (!byCoach.has(coachId)) byCoach.set(coachId, []);
    byCoach.get(coachId).push(gym);
  }

  let detachedGyms = 0;

  for (const [, gyms] of byCoach.entries()) {
    if (gyms.length <= 1) continue;

    const [keep, ...toDetach] = gyms;
    const detachIds = toDetach.map((item) => item.id);

    const { error: detachError } = await supabase
      .from('clients')
      .update({ coach_id: null })
      .in('id', detachIds);

    if (detachError) throw new Error(`Error detaching duplicated gyms for coach ${keep.coach_id}: ${detachError.message}`);
    detachedGyms += detachIds.length;
  }

  return { detachedGyms };
}

async function postCheckSummary() {
  const [{ count: profilesGym }, { count: clientsGym }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'gym'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'gym'),
  ]);

  return {
    profilesGym: profilesGym || 0,
    clientsGym: clientsGym || 0,
  };
}

async function run() {
  console.log('--- BACKFILL ATHLETE HIERARCHY START ---');

  const gymSync = await ensureGymClientPerGymProfile();
  console.log('Gym profile/client sync:', gymSync);

  const coachNormalization = await normalizeCoachIdsToProfileIds();
  console.log('Coach id normalization:', coachNormalization);

  const gymUniqueness = await enforceOneGymPerCoach();
  console.log('Gym uniqueness enforcement:', gymUniqueness);

  const summary = await postCheckSummary();
  console.log('Post-check summary:', summary);

  console.log('--- BACKFILL ATHLETE HIERARCHY DONE ---');
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
