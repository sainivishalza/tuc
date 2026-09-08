// Free, rule-based Incoterm recommender — no external API. Walks a buyer
// through two short questions and returns which of the five Incoterms a
// sourcing customer actually encounters (EXW, FOB, CIF, DAP, DDP) fits how
// much of the shipping process they want to handle themselves, plus a
// plain-language breakdown of who's responsible for what.

export type IncotermId = "EXW" | "FOB" | "CIF" | "DAP" | "DDP";
export type Party = "You" | "Supplier";

export interface IncotermProfile {
  id: IncotermId;
  name: string;
  summary: string;
  responsibilities: { stage: string; party: Party }[];
  watchOut: string;
}

const STAGES = [
  "Export customs clearance (China)",
  "Main freight (sea/air)",
  "Cargo insurance",
  "Import customs clearance (your country)",
  "Import duties & taxes",
  "Final delivery to your door",
] as const;

function profile(
  id: IncotermId,
  name: string,
  summary: string,
  supplierStages: number[],
  watchOut: string
): IncotermProfile {
  return {
    id,
    name,
    summary,
    responsibilities: STAGES.map((stage, i) => ({
      stage,
      party: supplierStages.includes(i) ? "Supplier" : "You",
    })),
    watchOut,
  };
}

export const INCOTERM_PROFILES: Record<IncotermId, IncotermProfile> = {
  EXW: profile(
    "EXW",
    "Ex Works (EXW)",
    "The supplier just makes the goods available at their factory — you or your agent handle everything from there.",
    [],
    "You're on the hook for export customs paperwork too, which most overseas buyers aren't set up to file themselves — usually only worth it if you already have a China-based agent."
  ),
  FOB: profile(
    "FOB",
    "Free On Board (FOB)",
    "The supplier delivers the goods onto the ship and clears export customs — you take over from the port of departure.",
    [0],
    "The most common choice for experienced importers who want to shop around for their own freight forwarder and control shipping cost directly."
  ),
  CIF: profile(
    "CIF",
    "Cost, Insurance & Freight (CIF)",
    "The supplier arranges and pays for the main freight and insurance to your destination port — you take over from there.",
    [0, 1, 2],
    "Convenient, but the supplier picks the carrier and insurer, which sometimes costs more than booking it yourself would."
  ),
  DAP: profile(
    "DAP",
    "Delivered At Place (DAP)",
    "The supplier delivers all the way to your named destination — but you're still responsible for import customs clearance and paying duties/taxes.",
    [0, 1, 2, 5],
    "Unexpected duty and tax bills right when the shipment arrives are the most common surprise here — ask for an estimate up front."
  ),
  DDP: profile(
    "DDP",
    "Delivered Duty Paid (DDP)",
    "The supplier handles everything, including import duties and taxes — you just receive the delivery.",
    [0, 1, 2, 3, 4, 5],
    "The simplest option, but usually the most expensive per unit since the supplier is pricing in every risk and fee upfront."
  ),
};

export type Step1Answer = "everything" | "destination_side" | "nothing";
export type Step2DestinationAnswer = "book_myself" | "supplier_arranges";
export type Step2NothingAnswer = "handle_duties_myself" | "all_included";

export function pickIncoterm(
  step1: Step1Answer | null,
  step2Destination: Step2DestinationAnswer | null,
  step2Nothing: Step2NothingAnswer | null
): IncotermId | null {
  if (step1 === "everything") return "EXW";
  if (step1 === "destination_side") {
    if (step2Destination === "book_myself") return "FOB";
    if (step2Destination === "supplier_arranges") return "CIF";
  }
  if (step1 === "nothing") {
    if (step2Nothing === "handle_duties_myself") return "DAP";
    if (step2Nothing === "all_included") return "DDP";
  }
  return null;
}
