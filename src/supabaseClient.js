import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://potowvactzxmbgqgsgyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdG93dmFjdHp4bWJncWdzZ3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDcwMzEsImV4cCI6MjA3OTU4MzAzMX0.T6YEhKipBT1I74lyIJXz7op_nRsEtd5DhuQpKjECeBA'; // Usa la anon key, nunca la service_role en frontend

export const supabase = createClient(supabaseUrl, supabaseAnonKey);