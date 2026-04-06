/**
 * Mirror of frontend month activity logic for API personalization.
 * @param {{ plantingMonths: number[]; harvestingMonths: number[] }} crop
 * @param {number} month 1-12
 * @returns {'planting'|'growing'|'harvesting'|null}
 */
function getActivityForMonth(crop, month) {
  const { plantingMonths, harvestingMonths } = crop;
  if (plantingMonths.includes(month)) return "planting";
  if (harvestingMonths.includes(month)) return "harvesting";
  const plantingEnd = Math.max(...plantingMonths);
  const harvestingStart = Math.min(...harvestingMonths);
  if (month > plantingEnd && month < harvestingStart) return "growing";
  if (plantingEnd > harvestingStart) {
    if (month > plantingEnd || month < harvestingStart) return "growing";
  }
  return null;
}

module.exports = { getActivityForMonth };
