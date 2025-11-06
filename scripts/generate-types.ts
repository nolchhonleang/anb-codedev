import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateTypes() {
  try {
    const { data, error } = await supabase.rpc('get_schema');
    
    if (error) throw error;
    
    const typesDir = path.join(process.cwd(), 'src', 'types');
    await fs.mkdir(typesDir, { recursive: true });
    
    const typesPath = path.join(typesDir, 'supabase.ts');
    await fs.writeFile(
      typesPath,
      `// This file is auto-generated. DO NOT edit manually.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: ${JSON.stringify(data.tables, null, 2)}
    Views: ${JSON.stringify(data.views, null, 2)}
    Functions: ${JSON.stringify(data.functions, null, 2)}
    Enums: ${JSON.stringify(data.enums, null, 2)}
  }
}
`
    );
    
    console.log('Types generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
