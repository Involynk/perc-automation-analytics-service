import { Global, Module } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.warn('Supabase client init warning:', err);
    cachedClient = createClient('https://placeholder.supabase.co', 'placeholder_key');
  }

  return cachedClient;
}

@Global()
@Module({
  providers: [
    {
      provide: SupabaseClient,
      useFactory: () => getSupabaseClient(),
    },
  ],
  exports: [SupabaseClient],
})
export class SupabaseModule {}
