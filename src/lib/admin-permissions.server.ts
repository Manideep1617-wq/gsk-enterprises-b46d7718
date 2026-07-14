import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminAccessResult = {
  isAdmin: boolean;
  reason: string | null;
};

export async function getAdminAccess(userId: string): Promise<AdminAccessResult> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Admin role lookup failed", { userId, message: error.message });
    return { isAdmin: false, reason: `Admin role lookup failed: ${error.message}` };
  }

  return data
    ? { isAdmin: true, reason: null }
    : { isAdmin: false, reason: "No admin role found for this signed-in account." };
}

export async function assertAdminUser(userId: string) {
  const access = await getAdminAccess(userId);
  if (!access.isAdmin) {
    throw new Error(access.reason ?? "Forbidden: admin role required");
  }
}