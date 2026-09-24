// Format an ISO date ("2026-09-28") for the active locale ("en-US" / "vi-VN")
export function formatLocalDate(iso, locale = "en-US", options = { month: "short", day: "numeric" }) {
  if (!iso) return "";
  // Parse as local midnight so the day doesn't shift with the timezone
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(locale, options);
}

// Today's date as ISO "YYYY-MM-DD" in local time
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// How many checklist items of a stage are done, given its progress (%)
export function completedItemCount(stage) {
  const total = stage.items?.length ?? 0;
  if (stage.status === "completed") return total;
  return Math.floor(((stage.progress ?? 0) / 100) * total);
}

// Trạng thái tiến độ nhân viên (SRS Step 54)
export const PROGRESS_STATUSES = ["On Track", "Requires Attention", "Behind Schedule", "Assessment Required", "Completed"];

const PROGRESS_TONES = {
  "On Track": "purple",
  "Requires Attention": "orange",
  "Behind Schedule": "red",
  "Assessment Required": "blue",
  Completed: "green",
};

export function progressTone(status) {
  return PROGRESS_TONES[status] || "default";
}

// Nhân viên cần quản lý can thiệp
export function needsAttention(status) {
  return status === "Requires Attention" || status === "Behind Schedule";
}

