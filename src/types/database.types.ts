import { Database as DatabaseGenerated } from "@/types/supabase";

export type Tables<T extends keyof DatabaseGenerated['public']['Tables']> = 
  DatabaseGenerated['public']['Tables'][T]['Row'];

export type Enums<T extends keyof DatabaseGenerated['public']['Enums']> = 
  DatabaseGenerated['public']['Enums'][T];

declare global {
  type Database = DatabaseGenerated;
}
