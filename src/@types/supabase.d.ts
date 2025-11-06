import { SupabaseClient, User, Session } from '@supabase/supabase-js';

declare global {
  // Extend the Window interface to include ENV variables
  interface Window {
    ENV: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_PUBLISHABLE_KEY: string;
    };
  }

  // Define the database schema
  interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string;
            email: string;
            name: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id: string;
            email: string;
            name?: string | null;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            email?: string;
            name?: string | null;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
      };
      Views: Record<string, unknown>;
      Functions: Record<string, unknown>;
      Enums: Record<string, string[]>;
    };
  }

  // Extend the SupabaseClient type with our database schema
  type SupabaseClientType = SupabaseClient<Database>;

  // Define the user profile type
  type UserProfile = Database['public']['Tables']['profiles']['Row'];
}

// This makes the file a module
export {};
