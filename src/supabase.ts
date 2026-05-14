import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gxokoxjrqyfrpuufrqeb.supabase.co";
const supabaseKey = "sb_publishable_q28Zhd3pCXk_0cHwgd41Yw_R9cj2G49";

export const supabase = createClient(supabaseUrl, supabaseKey);