import { getLatestValueBySlug } from "../api/progress";

export function calcBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const hCm = Number(heightCm);

  if (!Number.isFinite(w) || !Number.isFinite(hCm) || w <= 0 || hCm <= 0) return null;

  const h = hCm / 100;
  return Math.round((w / (h * h)) * 10) / 10;
}

export function bmiInfo(bmi) {
  const v = Number(bmi);
  if (!Number.isFinite(v)) return null;

  if (v < 18.5) {
    return {
      key: "underweight",
      label: "Underweight",
      hint: "BMI suggests your weight may be too low for your height.",
    };
  }

  if (v < 25) {
    return {
      key: "normal",
      label: "Normal weight",
      hint: "BMI is within the normal range. Track the trend over time.",
    };
  }

  if (v < 30) {
    return {
      key: "overweight",
      label: "Overweight",
      hint: "BMI indicates overweight. Regular activity and nutrition control often help.",
    };
  }

  return {
    key: "obesity",
    label: "Obesity",
    hint: "BMI indicates obesity. It’s worth starting with small, consistent changes.",
  };
}

export async function getBmiSnapshot({ profileHeightCm, profileWeightKg } = {}) {
  const hProfile =
    profileHeightCm != null && profileHeightCm !== "" ? Number(profileHeightCm) : null;

  const wProfile =
    profileWeightKg != null && profileWeightKg !== "" ? Number(profileWeightKg) : null;

  
  const latestWeight = await getLatestValueBySlug("weight");
  const weightKg = Number.isFinite(latestWeight)
    ? latestWeight
    : Number.isFinite(wProfile)
      ? wProfile
      : null;

  
  const latestHeight = await getLatestValueBySlug("height");
  const heightCm = Number.isFinite(hProfile)
    ? hProfile
    : Number.isFinite(latestHeight)
      ? latestHeight
      : null;

  if (!heightCm && !weightKg) return { ok: false, missing: ["height", "weight"] };
  if (!heightCm) return { ok: false, missing: ["height"] };
  if (!weightKg) return { ok: false, missing: ["weight"] };

  const bmi = calcBmi(weightKg, heightCm);

  return {
    ok: true,
    bmi,
    info: bmiInfo(bmi),
    heightCm,
    weightKg,
    source: {
      height: Number.isFinite(hProfile) ? "profile" : "progress",
      weight: Number.isFinite(latestWeight) ? "progress" : "profile",
    },
  };
}