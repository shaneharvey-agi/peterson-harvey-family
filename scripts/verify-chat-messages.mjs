// One-shot verification that chat_messages exists with the expected schema.
// Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
// Run: node --env-file=../../../../.env.local scripts/verify-chat-messages.mjs

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

console.log('→ Connecting to', url);

// 1. Verify the table exists by doing a count query.
const { count, error: countErr } = await supabase
  .from('chat_messages')
  .select('*', { count: 'exact', head: true });

if (countErr) {
  console.error('✗ chat_messages table check FAILED:');
  console.error('  code:', countErr.code);
  console.error('  message:', countErr.message);
  console.error('  hint:', countErr.hint || '(none)');
  process.exit(2);
}

console.log(`✓ chat_messages table exists (current row count: ${count ?? 0})`);

// 2. Verify expected columns by doing a 1-row select.
const { data: sample, error: sampleErr } = await supabase
  .from('chat_messages')
  .select('id,thread_key,sender,body,read_at,created_at')
  .limit(1);

if (sampleErr) {
  console.error('✗ chat_messages column check FAILED:');
  console.error('  message:', sampleErr.message);
  process.exit(3);
}

console.log('✓ Expected columns present (id, thread_key, sender, body, read_at, created_at)');
if (sample && sample.length > 0) {
  console.log('  Sample row:', JSON.stringify(sample[0]));
}

// 3. End-to-end write/read/cleanup test using the canonical sendMessage shape.
const testThread = 'molly';
const testBody = `[verify ${Date.now()}] connection check from Steve`;

const { data: inserted, error: insertErr } = await supabase
  .from('chat_messages')
  .insert({
    thread_key: testThread,
    sender: 'shane',
    body: testBody,
    read_at: new Date().toISOString(),
  })
  .select('*')
  .single();

if (insertErr) {
  console.error('✗ INSERT FAILED — RLS or permissions issue:');
  console.error('  code:', insertErr.code);
  console.error('  message:', insertErr.message);
  process.exit(4);
}

console.log(`✓ INSERT worked — id=${inserted.id}, created_at=${inserted.created_at}`);

const { data: readBack, error: readErr } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('id', inserted.id)
  .single();

if (readErr || !readBack) {
  console.error('✗ READ-BACK FAILED:', readErr?.message ?? '(no row)');
  process.exit(5);
}

console.log(`✓ READ-BACK worked — body matches: ${readBack.body === testBody}`);

const { error: deleteErr } = await supabase
  .from('chat_messages')
  .delete()
  .eq('id', inserted.id);

if (deleteErr) {
  console.warn(`⚠ Cleanup DELETE failed (id ${inserted.id}): ${deleteErr.message}`);
  console.warn('  You may want to delete this verification row by hand.');
} else {
  console.log('✓ Cleanup DELETE worked');
}

console.log('\n✅ chat_messages is fully wired. Voice→message bridge will write through to live Supabase.');
