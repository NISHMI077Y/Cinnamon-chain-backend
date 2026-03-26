/**
 * Calculates cinnamon grade from HPLC lab data.
 * Grade A (Alba / C-Special): highest quality
 * Grade B (C-4 / C-5): standard quality
 * Grade C: lower quality
 */
const calculate = ({ coumarin_level, moisture_content, oil_content, cinnamaldehyde_percent }) => {
  let score = 0;

  // Coumarin: lower is better (Ceylon cinnamon typically < 0.004%)
  if (coumarin_level <= 0.004) score += 30;
  else if (coumarin_level <= 0.01) score += 20;
  else if (coumarin_level <= 0.05) score += 10;

  // Moisture: lower is better (ideal < 12%)
  if (moisture_content <= 10) score += 20;
  else if (moisture_content <= 12) score += 15;
  else if (moisture_content <= 14) score += 5;

  // Oil content: higher is better (ideal > 2%)
  if (oil_content >= 2.5) score += 25;
  else if (oil_content >= 1.5) score += 15;
  else if (oil_content >= 1.0) score += 5;

  // Cinnamaldehyde: higher is better (ideal > 60%)
  if (cinnamaldehyde_percent >= 75) score += 25;
  else if (cinnamaldehyde_percent >= 60) score += 15;
  else if (cinnamaldehyde_percent >= 45) score += 5;

  let grade, market_rate_per_kg;

  if (score >= 80) {
    grade = 'A';
    market_rate_per_kg = 4500;
  } else if (score >= 50) {
    grade = 'B';
    market_rate_per_kg = 2800;
  } else {
    grade = 'C';
    market_rate_per_kg = 1500;
  }

  return { grade, market_rate_per_kg, quality_score: score };
};

module.exports = { calculate };