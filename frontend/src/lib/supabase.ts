import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exbbzawroyhgvcdgrtqc.supabase.co';
const supabaseAnonKey = 'sb_publishable_0BiaZWuy2dSy0heY3td9qg_xtQWWm4W';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
