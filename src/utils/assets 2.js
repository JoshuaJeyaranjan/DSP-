import { supabase } from "./supabaseClient";

/**
 * Get assets by type (e.g., 'about', 'contact', 'logo')
 * Optionally filter by a specific name
 * Returns: 
 *   - Object if `name` is provided
 *   - Array if only `type` is provided
 *   - null if no matching rows
 */
export async function getAssetsByType(type, name = null) {
  try {
    let query = supabase.from("site_assets").select("*").eq("type", type);

    if (name) {
      // single row fetch
      query = query.eq("name", name).single();
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[getAssetsByType] Supabase error:`, error);
      return null;
    }

    if (!data) {
      console.warn(`[getAssetsByType] No assets found for type="${type}" name="${name}"`);
      return null;
    }

    return data;
  } catch (err) {
    console.error(`[getAssetsByType] Unexpected error:`, err);
    return null;
  }
}

/**
 * Update an asset by type and name
 */
export async function updateAsset(type, name, newUrl) {
  try {
    const { data, error } = await supabase
      .from("site_assets")
      .update({ url: newUrl })
      .eq("type", type)
      .eq("name", name)
      .select()
      .single();

    if (error) {
      console.error(`[updateAsset] Supabase error:`, error);
      return null;
    }

    return data;
  } catch (err) {
    console.error(`[updateAsset] Unexpected error:`, err);
    return null;
  }
}