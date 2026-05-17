import { createClient } from '@supabase/supabase-js';
import type { Database } from "./supabase.types"

const supabaseUrl = "https://gxokoxjrqyfrpuufrqeb.supabase.co";
const supabaseKey = "sb_publishable_q28Zhd3pCXk_0cHwgd41Yw_R9cj2G49";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);