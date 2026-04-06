/**
 * Seed CropCalendarGuide from scripts/cropCalendarSeedData.cjs if collection is empty.
 * Usage: node scripts/seedCropCalendar.js
 * Requires MONGO_URI in .env (run from Farm-back directory).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const CropCalendarGuide = require("../models/CropCalendarGuide");
const seedRows = require("./cropCalendarSeedData.cjs");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const n = await CropCalendarGuide.countDocuments();
  if (n > 0) {
    console.log(`CropCalendarGuide already has ${n} row(s); skip seed.`);
    await mongoose.disconnect();
    return;
  }
  await CropCalendarGuide.insertMany(seedRows);
  console.log(`Inserted ${seedRows.length} calendar guide rows.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
