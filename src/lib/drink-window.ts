export type DrinkStatus =
  | "too_young"
  | "approaching"
  | "ready"
  | "peak"
  | "past_peak";

export interface DrinkWindow {
  status: DrinkStatus;
  label: string;
  readyStart: number;
  readyEnd: number;
  peakStart: number;
  peakEnd: number;
  currentAge: number;
}

export function getDrinkWindow(
  classification: string,
  vintage: number,
  color: string
): DrinkWindow | null {
  if (!vintage || vintage < 1900) return null;

  const currentYear = new Date().getFullYear();
  const age = currentYear - vintage;

  // Base windows for red wines
  let readyStart: number;
  let readyEnd: number;
  let peakStart: number;
  let peakEnd: number;

  switch (classification) {
    case "Grand Cru":
      readyStart = 10;
      readyEnd = 15;
      peakStart = 15;
      peakEnd = 30;
      break;
    case "Premier Cru":
      readyStart = 7;
      readyEnd = 12;
      peakStart = 12;
      peakEnd = 20;
      break;
    case "Village":
      readyStart = 4;
      readyEnd = 7;
      peakStart = 7;
      peakEnd = 12;
      break;
    default: // Regional
      readyStart = 2;
      readyEnd = 4;
      peakStart = 4;
      peakEnd = 8;
      break;
  }

  // Whites have roughly half the window
  if (color === "white") {
    readyStart = Math.round(readyStart * 0.5);
    readyEnd = Math.round(readyEnd * 0.5);
    peakStart = Math.round(peakStart * 0.5);
    peakEnd = Math.round(peakEnd * 0.5);
  }

  let status: DrinkStatus;
  let label: string;

  if (age < readyStart) {
    status = "too_young";
    label = "Too Young";
  } else if (age < peakStart) {
    status = "approaching" as DrinkStatus;
    // Actually this is "ready" range
    status = "ready";
    label = "Ready";
  } else if (age <= peakEnd) {
    status = "peak";
    label = "Peak";
  } else {
    status = "past_peak";
    label = "Past Peak";
  }

  // Refine: if within 2 years of readyStart, mark as approaching
  if (age < readyStart && age >= readyStart - 2) {
    status = "approaching";
    label = "Approaching";
  }

  return {
    status,
    label,
    readyStart: vintage + readyStart,
    readyEnd: vintage + readyEnd,
    peakStart: vintage + peakStart,
    peakEnd: vintage + peakEnd,
    currentAge: age,
  };
}
