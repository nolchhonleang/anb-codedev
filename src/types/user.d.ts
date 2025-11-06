import { User as SupabaseUser } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface User extends SupabaseUser {
      id: string;
      email: string;
      name?: string;
      bio?: string;
      website?: string;
      github?: string;
      twitter?: string;
      linkedin?: string;
      preferredLanguage?: string;
      theme?: 'light' | 'dark' | 'system';
      avatar_url?: string;
      created_at?: string;
      updated_at?: string;
    }
  }
}

export {};
