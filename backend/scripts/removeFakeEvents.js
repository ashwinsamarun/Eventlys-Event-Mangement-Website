/**
 * Remove fake/seed events from the database.
 *
 * What counts as "fake" here?
 * - Any event tagged with "seed" in `tags`
 * - OR any event whose title contains "sample" or "demo" (case-insensitive)
 *
 * You can adjust the filters to match how your frontend previously created fake events.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/Event");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI in backend/.env");

  await mongoose.connect(uri);

  const filter = {
    $or: [
      { tags: { $in: ["seed"] } },
      { title: { $regex: /(sample|demo)/i } },
    ],
  };

  const result = await Event.deleteMany(filter);
  console.log(`✅ Removed ${result.deletedCount} fake/seed events`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ removeFakeEvents failed:", err);
  process.exit(1);
});
