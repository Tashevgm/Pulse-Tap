import { registerDemoGoogleUser } from "@/lib/user-store";
import { hasSupabaseEnv, createSupabaseAdminClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  provider: string;
};

export async function ensureActivationProfile(existingUserId?: string) {
  if (!hasSupabaseEnv()) {
    const user = await registerDemoGoogleUser();
    return user.id;
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (existingUserId) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingUserId)
        .maybeSingle();

      if (data?.id) {
        return data.id as string;
      }
    }

    const email = "demo@pulsetap.co.uk";
    const { data: existingProfile, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingProfile?.id) {
      return existingProfile.id as string;
    }

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        email,
        full_name: "PulseTap Demo User",
        company_name: "PulseTap Customer",
        provider: "demo"
      })
      .select("id")
      .single<ProfileRow>();

    if (createError) {
      throw createError;
    }

    return createdProfile.id;
  } catch (error) {
    console.warn("Supabase profile unavailable, using local demo user.", error);
    const user = await registerDemoGoogleUser();
    return user.id;
  }
}
