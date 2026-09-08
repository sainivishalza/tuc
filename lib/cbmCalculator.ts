// Free container/CBM calculator — no external API, no cost. Helps a buyer
// work out how much space and weight their order actually takes, and
// which shipping method or container size fits it — the kind of
// back-of-envelope math a freight forwarder does before quoting.

export interface CbmInput {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKgPerCarton: number;
  cartons: number;
}

export type CbmRecommendation =
  | { kind: "air" }
  | { kind: "lcl" }
  | { kind: "compare20"; containers: 1 }
  | { kind: "fcl40"; containers: 1 }
  | { kind: "multiple40"; containers: number };

export interface CbmResult {
  totalVolumeM3: number;
  totalWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  recommendation: CbmRecommendation;
  isBulky: boolean;
}

const AIR_VOLUMETRIC_DIVISOR = 6000; // cm^3 per kg — IATA standard for air-freight volumetric weight

const CONTAINER_20FT = { capacityM3: 28, maxPayloadKg: 17600 };
const CONTAINER_40FT = { capacityM3: 58, maxPayloadKg: 26000 };

function containersNeeded(totalVolumeM3: number, totalWeightKg: number, container: { capacityM3: number; maxPayloadKg: number }): number {
  return Math.max(1, Math.ceil(totalVolumeM3 / container.capacityM3), Math.ceil(totalWeightKg / container.maxPayloadKg));
}

export function calculateCbm(input: CbmInput): CbmResult {
  const totalVolumeM3 = (input.lengthCm * input.widthCm * input.heightCm * input.cartons) / 1_000_000;
  const totalWeightKg = input.weightKgPerCarton * input.cartons;
  const volumetricWeightKg = (input.lengthCm * input.widthCm * input.heightCm * input.cartons) / AIR_VOLUMETRIC_DIVISOR;
  const chargeableWeightKg = Math.max(totalWeightKg, volumetricWeightKg);

  let recommendation: CbmRecommendation;

  if (totalVolumeM3 < 2) {
    recommendation = { kind: "air" };
  } else if (totalVolumeM3 < 15) {
    recommendation = { kind: "lcl" };
  } else {
    const n20 = containersNeeded(totalVolumeM3, totalWeightKg, CONTAINER_20FT);
    const n40 = containersNeeded(totalVolumeM3, totalWeightKg, CONTAINER_40FT);
    if (n20 <= 1) {
      recommendation = { kind: "compare20", containers: 1 };
    } else if (n40 <= 1) {
      recommendation = { kind: "fcl40", containers: 1 };
    } else {
      recommendation = { kind: "multiple40", containers: n40 };
    }
  }

  const isBulky = volumetricWeightKg > totalWeightKg * 1.3;

  return { totalVolumeM3, totalWeightKg, volumetricWeightKg, chargeableWeightKg, recommendation, isBulky };
}
