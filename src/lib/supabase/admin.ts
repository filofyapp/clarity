import { createClient } from "@supabase/supabase-js";

// This client must only be used inside Server Actions or API Routes context!
// It uses the Service Role Key, granting it SUPERUSER access, thereby bypassing Row Level Security.
export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};
