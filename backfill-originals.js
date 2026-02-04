import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = process.env.VITE_PROJECT_URL;
const ANON_KEY = process.env.VITE_ANON_KEY;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD;

const supabase = createClient(PROJECT_URL, ANON_KEY);

const VALID_CATEGORIES = ["car", "sports", "drone", "portrait", "product"];

async function backfillOriginals() {
  console.log("🔄 Logging in as admin...");
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginErr) {
    console.error("❌ Admin login failed:", loginErr.message);
    return;
  }

  console.log("📂 Listing files in photos-original...");
  const { data: files, error: listErr } = await supabase.storage
    .from("photos-original")
    .list("", { limit: 2000 });
  if (listErr) {
    console.error("❌ Error listing originals:", listErr.message);
    return;
  }
  console.log(`Found ${files.length} files in photos-original`);

  const { data: existingRows, error: dbErr } = await supabase
    .from("images")
    .select("path");
  if (dbErr) {
    console.error("❌ Error reading images table:", dbErr.message);
    return;
  }
  const existingPaths = new Set(existingRows.map((r) => r.path));

  let inserted = 0;
  for (const file of files) {
    if (existingPaths.has(file.name)) {
      console.log(`⏭️ Skipping existing ${file.name}`);
      continue;
    }

    const category = "sports";

    const { data: userResp } = await supabase.auth.getUser();

    const { error: insertErr } = await supabase.from("images").insert({
      title: file.name,
      description: null,
      category,
      bucket: "photos-original",
      path: file.name,
      thumbnail: false,
      is_home_hero: false,
      is_photo_hero: false,
      is_video_hero: false,
      uploaded_by: userResp?.user?.id ?? null,
    });

    if (insertErr) {
      console.error(`❌ Insert error for ${file.name}`, insertErr);
    } else {
      inserted++;
    }
  }
}

backfillOriginals();
