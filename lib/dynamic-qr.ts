import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type DynamicQrRow = {
  id: string;
  owner_profile_id: string;
  slug: string;
  name: string;
  destination_url: string;
  scans: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DynamicQrCode = {
  id: string;
  ownerProfileId: string;
  slug: string;
  name: string;
  destinationUrl: string;
  scans: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function mapDynamicQr(row: DynamicQrRow): DynamicQrCode {
  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id,
    slug: row.slug,
    name: row.name,
    destinationUrl: row.destination_url,
    scans: Number(row.scans),
    lastScannedAt: row.last_scanned_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function normalizeDynamicQrDestination(value: string) {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http and https destinations are supported.");
  }

  if (parsed.href.length > 2048) {
    throw new Error("Destination URL is too long.");
  }

  return parsed.href;
}

export function dynamicQrPublicUrl(slug: string, origin?: string) {
  const base = (origin || process.env.NEXT_PUBLIC_SITE_URL || "https://www.pulse-tap.com").replace(/\/$/, "");
  return `${base}/q/${slug}`;
}

export async function listDynamicQrCodes(ownerProfileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dynamic_qr_codes")
    .select("*")
    .eq("owner_profile_id", ownerProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DynamicQrRow[]).map(mapDynamicQr);
}

export async function createDynamicQrCode({
  ownerProfileId,
  name,
  destinationUrl
}: {
  ownerProfileId: string;
  name: string;
  destinationUrl: string;
}) {
  const supabase = createSupabaseAdminClient();
  const normalizedName = name.trim();

  if (!normalizedName || normalizedName.length > 80) {
    throw new Error("Name must be between 1 and 80 characters.");
  }

  const normalizedDestination = normalizeDynamicQrDestination(destinationUrl);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomBytes(6).toString("base64url").toLowerCase();
    const { data, error } = await supabase
      .from("dynamic_qr_codes")
      .insert({
        owner_profile_id: ownerProfileId,
        slug,
        name: normalizedName,
        destination_url: normalizedDestination
      })
      .select("*")
      .single<DynamicQrRow>();

    if (!error && data) return mapDynamicQr(data);
    if (error?.code !== "23505") throw error;
  }

  throw new Error("Could not allocate a unique QR link.");
}

export async function updateDynamicQrCode({
  id,
  ownerProfileId,
  name,
  destinationUrl
}: {
  id: string;
  ownerProfileId: string;
  name: string;
  destinationUrl: string;
}) {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 80) {
    throw new Error("Name must be between 1 and 80 characters.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dynamic_qr_codes")
    .update({
      name: normalizedName,
      destination_url: normalizeDynamicQrDestination(destinationUrl)
    })
    .eq("id", id)
    .eq("owner_profile_id", ownerProfileId)
    .select("*")
    .maybeSingle<DynamicQrRow>();

  if (error) throw error;
  return data ? mapDynamicQr(data) : null;
}

export async function deleteDynamicQrCode(id: string, ownerProfileId: string) {
  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("dynamic_qr_codes")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("owner_profile_id", ownerProfileId);

  if (error) throw error;
  return Boolean(count);
}

export async function resolveDynamicQrCode(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("resolve_dynamic_qr", {
    p_slug: slug.trim().toLowerCase()
  });

  if (error) throw error;
  const rows = data as Array<{ destination_url: string }> | null;
  return rows?.[0]?.destination_url ?? null;
}
