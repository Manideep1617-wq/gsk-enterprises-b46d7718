export async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function assertAdmin(supabase: any, userId: string) {
  if (!(await isAdmin(supabase, userId))) {
    throw new Error("Forbidden: admin role required");
  }
}