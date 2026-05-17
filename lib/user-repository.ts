import { registerDemoGoogleUser } from "@/lib/user-store";
import { hasSupabaseEnv, createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileByAuthUserId, upsertProfileForAuthUser, type SupabaseProfile } from "@/lib/supabase/profile";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  provider: string;
};

export type CurrentProfile = {
  id: string;
  email: string;
  name: string;
  companyName: string;
  provider: string;
  isAuthenticated: boolean;
};

function toCurrentProfile(profile: SupabaseProfile | ProfileRow, isAuthenticated: boolean): CurrentProfile {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    companyName: profile.company_name,
    provider: profile.provider,
    isAuthenticated
  };
}

export async function getCurrentProfile(existingUserId?: string): Promise<CurrentProfile | null> {
  if (hasSupabaseEnv() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const profile = (await getProfileByAuthUserId(user.id)) ?? (await upsertProfileForAuthUser(user));
        return toCurrentProfile(profile, true);
      }
    } catch (error) {
      console.warn("Supabase auth profile unavailable.", error);
    }
  }

  if (hasSupabaseEnv() && existingUserId) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,company_name,provider")
        .eq("id", existingUserId)
        .maybeSingle<ProfileRow>();

      if (error) {
        throw error;
      }

      if (data) {
        return toCurrentProfile(data, false);
      }
    } catch (error) {
      console.warn("Supabase cookie profile unavailable.", error);
    }
  }

  return null;
}

export async function ensureActivationProfile(existingUserId?: string) {
  const currentProfile = await getCurrentProfile(existingUserId);

  if (currentProfile) {
    return currentProfile.id;
  }

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
