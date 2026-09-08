// Free, rule-based Incoterm recommender — no external API. Walks a buyer
// through two short questions and returns which of the five Incoterms a
// sourcing customer actually encounters (EXW, FOB, CIF, DAP, DDP) fits how
// much of the shipping process they want to handle themselves, plus a
// plain-language breakdown of who's responsible for what.

export type IncotermId = "EXW" | "FOB" | "CIF" | "DAP" | "DDP";
export type Party = "you" | "supplier";

export interface IncotermProfileContent {
  name: string;
  summary: string;
  watchOut: string;
}

export interface StageContent {
  exportCustoms: string;
  mainFreight: string;
  insurance: string;
  importCustoms: string;
  dutiesTaxes: string;
  finalDelivery: string;
}

export interface IncotermProfile extends IncotermProfileContent {
  id: IncotermId;
  responsibilities: { stage: string; party: Party }[];
}

const SUPPLIER_STAGES: Record<IncotermId, number[]> = {
  EXW: [],
  FOB: [0],
  CIF: [0, 1, 2],
  DAP: [0, 1, 2, 5],
  DDP: [0, 1, 2, 3, 4, 5],
};

const STAGE_KEYS: (keyof StageContent)[] = [
  "exportCustoms",
  "mainFreight",
  "insurance",
  "importCustoms",
  "dutiesTaxes",
  "finalDelivery",
];

export function getIncotermProfiles(
  content: Record<IncotermId, IncotermProfileContent>,
  stages: StageContent
): Record<IncotermId, IncotermProfile> {
  const result = {} as Record<IncotermId, IncotermProfile>;
  (Object.keys(SUPPLIER_STAGES) as IncotermId[]).forEach((id) => {
    const supplierStages = SUPPLIER_STAGES[id];
    result[id] = {
      id,
      ...content[id],
      responsibilities: STAGE_KEYS.map((key, i) => ({
        stage: stages[key],
        party: supplierStages.includes(i) ? "supplier" : "you",
      })),
    };
  });
  return result;
}

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
