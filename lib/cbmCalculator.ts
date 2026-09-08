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

export interface CbmResult {
  totalVolumeM3: number;
  totalWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  recommendation: string;
  containerNote: string | null;
  tip: string;
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

  let recommendation: string;
  let containerNote: string | null = null;

  if (totalVolumeM3 < 2) {
    recommendation = "Air freight or express courier — too small to benefit from ocean freight.";
  } else if (totalVolumeM3 < 15) {
    recommendation = "LCL (shared container) — the usual choice at this volume.";
  } else {
    const n20 = containersNeeded(totalVolumeM3, totalWeightKg, CONTAINER_20FT);
    const n40 = containersNeeded(totalVolumeM3, totalWeightKg, CONTAINER_40FT);
    if (n20 <= 1) {
      recommendation = "Compare LCL vs. a dedicated 20ft container — often close in price past ~15 CBM.";
      containerNote = "Fits in one 20ft container.";
    } else if (n40 <= 1) {
      recommendation = "Dedicated 40ft container (FCL).";
      containerNote = "Fits in one 40ft container.";
    } else {
      recommendation = `Multiple 40ft containers — plan for about ${n40}.`;
      containerNote = `About ${n40} × 40ft containers.`;
    }
  }

  const isBulky = volumetricWeightKg > totalWeightKg * 1.3;
  const tip = isBulky
    ? `Your cargo is bulky relative to its weight — air freight and express couriers bill by volumetric weight (${Math.round(volumetricWeightKg).toLocaleString()} kg here), not actual weight (${Math.round(totalWeightKg).toLocaleString()} kg). Ocean freight is priced by volume too, so this mainly matters if you're comparing against air.`
    : "Your cargo is dense enough that carriers will bill by actual weight, not volume — that generally works in your favor on cost.";

  return { totalVolumeM3, totalWeightKg, volumetricWeightKg, chargeableWeightKg, recommendation, containerNote, tip };
}
