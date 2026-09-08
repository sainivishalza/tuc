// Free payment-schedule generator — no external API. Turns an order
// value, deposit percentage, and production lead time into the concrete
// dates and dollar amounts a first-time buyer will actually see —
// deposit, production start, QC inspection, balance due, and ship date.

export type MilestoneId = "deposit" | "productionStart" | "qc" | "balance" | "ship";

export interface MilestoneContent {
  label: string;
  note: string;
}

export interface PaymentScheduleInput {
  totalValue: number;
  depositPct: number;
  leadTimeDays: number;
}

export interface PaymentMilestone {
  id: MilestoneId;
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

export function buildPaymentSchedule(
  input: PaymentScheduleInput,
  orderDateIso: string,
  content: Record<MilestoneId, MilestoneContent>
): PaymentScheduleResult {
  const depositAmount = Math.round((input.totalValue * input.depositPct) / 100);
  const balanceAmount = input.totalValue - depositAmount;

  const qcOffset = PRODUCTION_START_OFFSET + Math.max(1, Math.round(input.leadTimeDays * 0.85));
  const balanceDueOffset = PRODUCTION_START_OFFSET + input.leadTimeDays;
  const shipOffset = balanceDueOffset + SHIP_BUFFER_OFFSET;

  const milestones: PaymentMilestone[] = [
    {
      id: "deposit",
      label: content.deposit.label,
      date: orderDateIso,
      amount: depositAmount,
      note: content.deposit.note.replace("{pct}", String(input.depositPct)),
    },
    {
      id: "productionStart",
      label: content.productionStart.label,
      date: addDays(orderDateIso, PRODUCTION_START_OFFSET),
      amount: null,
      note: content.productionStart.note,
    },
    {
      id: "qc",
      label: content.qc.label,
      date: addDays(orderDateIso, qcOffset),
      amount: null,
      note: content.qc.note,
    },
    {
      id: "balance",
      label: content.balance.label,
      date: addDays(orderDateIso, balanceDueOffset),
      amount: balanceAmount,
      note: content.balance.note,
    },
    {
      id: "ship",
      label: content.ship.label,
      date: addDays(orderDateIso, shipOffset),
      amount: null,
      note: content.ship.note,
    },
  ];

  return { depositAmount, balanceAmount, milestones };
}
