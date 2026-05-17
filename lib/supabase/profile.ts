import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SupabaseProfile = {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  company_name: string;
  provider: string;
};

export async function upsertProfileForAuthUser(user: User) {
  const supabase = createSupabaseAdminClient();
  const email = user.email?.toLowerCase();

  if (!email) {
    throw new Error("Supabase user has no email.");
  }

  const fullName =
    (user.user_metadata.full_name as string | undefined) ||
    (user.user_metadata.name as string | undefined) ||
    email.split("@")[0];
  const companyName =
    (user.user_metadata.company_name as string | undefined) ||
    (user.user_metadata.name as string | undefined) ||
    fullName;
  const provider = user.app_metadata.provider as string | undefined;

  const profilePayload = {
    auth_user_id: user.id,
    email,
    full_name: fullName,
    company_name: companyName,
    provider: provider ?? "email"
  };

  const { data: authProfile, error: authProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<SupabaseProfile>();

  if (authProfileError) {
    throw authProfileError;
  }

  if (authProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", authProfile.id)
      .select("*")
      .single<SupabaseProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data: emailProfile, error: emailProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle<SupabaseProfile>();

  if (emailProfileError) {
    throw emailProfileError;
  }

  if (emailProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", emailProfile.id)
      .select("*")
      .single<SupabaseProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase.from("profiles").insert(profilePayload).select("*").single<SupabaseProfile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<SupabaseProfile>();

  if (error) {
    throw error;
  }

  return data;
}
