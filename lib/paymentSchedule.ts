// Free payment-schedule generator — no external API. Turns an order
// value, deposit percentage, and production lead time into the concrete
// dates and dollar amounts a first-time buyer will actually see —
// deposit, production start, QC inspection, balance due, and ship date.

export interface PaymentScheduleInput {
  totalValue: number;
  depositPct: number;
  leadTimeDays: number;
}

export interface PaymentMilestone {
  label: string;
  date: string;
  amount: number | null;
  note: string;
}

export interface PaymentScheduleResult {
  depositAmount: number;
  balanceAmount: number;
  milestones: PaymentMilestone[];
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const PRODUCTION_START_OFFSET = 3; // days for deposit to clear and PO to be confirmed
const SHIP_BUFFER_OFFSET = 2; // days between balance clearing and goods actually leaving

export function buildPaymentSchedule(input: PaymentScheduleInput, orderDateIso: string): PaymentScheduleResult {
  const depositAmount = Math.round((input.totalValue * input.depositPct) / 100);
  const balanceAmount = input.totalValue - depositAmount;

  const qcOffset = PRODUCTION_START_OFFSET + Math.max(1, Math.round(input.leadTimeDays * 0.85));
  const balanceDueOffset = PRODUCTION_START_OFFSET + input.leadTimeDays;
  const shipOffset = balanceDueOffset + SHIP_BUFFER_OFFSET;

  const milestones: PaymentMilestone[] = [
    {
      label: "Deposit due",
      date: orderDateIso,
      amount: depositAmount,
      note: `${input.depositPct}% deposit to confirm your order and start production.`,
    },
    {
      label: "Production starts",
      date: addDays(orderDateIso, PRODUCTION_START_OFFSET),
      amount: null,
      note: "The factory begins production once your deposit clears.",
    },
    {
      label: "Quality inspection",
      date: addDays(orderDateIso, qcOffset),
      amount: null,
      note: "Pre-shipment QC inspection, while there's still time to fix issues before the goods leave the factory.",
    },
    {
      label: "Balance due",
      date: addDays(orderDateIso, balanceDueOffset),
      amount: balanceAmount,
      note: "Remaining balance, due before the goods are released for shipment.",
    },
    {
      label: "Goods ship",
      date: addDays(orderDateIso, shipOffset),
      amount: null,
      note: "The factory releases your shipment once the balance clears.",
    },
  ];

  return { depositAmount, balanceAmount, milestones };
}
