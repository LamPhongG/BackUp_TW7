import { useLanguage } from "../contexts/LanguageContext";

/**
 * ValidationTag - Hiển thị trạng thái kiểm định từ pipeline Python
 * Status options:
 *  - "verified"           → ✓ Verified (green)
 *  - "verified_warning"   → ⚠ Verified with Warning (yellow/orange)
 *  - "partially_verified" → ◐ Partially Verified (orange)
 *  - "source_missing"     → ✗ Source Support Missing (red)
 *  - "requirement_missing"→ ✗ Requirement Missing (red)
 *  - "unsupported"        → ✗ Unsupported Requirement (red)
 *  - "outdated_source"    → ⚠ Outdated Source (orange)
 *  - "hallucination"      → ✗ Hallucination Detected (red)
 *  - "contradiction"      → ✗ Contradiction Detected (red)
 *  - "manual_review"      → ⏳ Manual Review Required (purple)
 *  - "pending"            → ○ Pending Validation (gray)
 */

// label/description là key trong locales (vtag_*)
const STATUS_CONFIG = {
  verified: {
    label: "vtag_verified",
    icon: "✓",
    className: "vtag vtag--verified",
    description: "vtag_verified_desc",
  },
  verified_warning: {
    label: "vtag_warning",
    icon: "⚠",
    className: "vtag vtag--warning",
    description: "vtag_warning_desc",
  },
  partially_verified: {
    label: "vtag_partially_verified",
    icon: "◐",
    className: "vtag vtag--warning",
    description: "vtag_partially_verified_desc",
  },
  source_missing: {
    label: "vtag_source_missing",
    icon: "✗",
    className: "vtag vtag--danger",
    description: "vtag_source_missing_desc",
  },
  requirement_missing: {
    label: "vtag_requirement_missing",
    icon: "✗",
    className: "vtag vtag--danger",
    description: "vtag_requirement_missing_desc",
  },
  unsupported: {
    label: "vtag_unsupported",
    icon: "✗",
    className: "vtag vtag--danger",
    description: "vtag_unsupported_desc",
  },
  outdated_source: {
    label: "vtag_outdated_source",
    icon: "⚠",
    className: "vtag vtag--warning",
    description: "vtag_outdated_source_desc",
  },
  hallucination: {
    label: "vtag_hallucination",
    icon: "✗",
    className: "vtag vtag--danger",
    description: "vtag_hallucination_desc",
  },
  contradiction: {
    label: "vtag_contradiction",
    icon: "✗",
    className: "vtag vtag--danger",
    description: "vtag_contradiction_desc",
  },
  manual_review: {
    label: "vtag_manual_review",
    icon: "⏳",
    className: "vtag vtag--review",
    description: "vtag_manual_review_desc",
  },
  pending: {
    label: "vtag_pending",
    icon: "○",
    className: "vtag vtag--pending",
    description: "vtag_pending_desc",
  },
};

export default function ValidationTag({ status = "pending", showLabel = true, showTooltip = true }) {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span className={`${config.className}`} title={showTooltip ? t(config.description) : undefined}>
      <span className="vtag__icon">{config.icon}</span>
      {showLabel && <span className="vtag__label">{t(config.label)}</span>}
    </span>
  );
}

/**
 * ValidationSummary - Bảng tổng hợp trạng thái kiểm định
 */
const SUMMARY_KEYS = [
  "verified", "verified_warning", "partially_verified", "source_missing", "requirement_missing",
  "unsupported", "outdated_source", "contradiction", "hallucination", "manual_review",
];

export function ValidationSummary({ counts = {} }) {
  const { t } = useLanguage();
  // Đủ các trạng thái trong SRS (mục 1.2) + cờ Hallucination
  const items = SUMMARY_KEYS.map(key => ({ key, ...STATUS_CONFIG[key] }));

  return (
    <div className="validation-summary">
      {items.map(item => (
        <div key={item.key} className="validation-summary__item" title={t(item.description)}>
          <span className={`${STATUS_CONFIG[item.key].className} vtag--compact`}>
            {item.icon}
          </span>
          <span className="validation-summary__label">{t(item.label)}</span>
          <strong className="validation-summary__count">{counts[item.key] ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}
