/**
 * Skeleton Loader Components
 * Dùng cho các action chờ GenAI API hoặc upload tài liệu lớn
 */

/** Skeleton block cơ bản */
export function SkeletonBlock({ width = "100%", height = "14px", radius = "6px", className = "" }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, display: "block" }}
    />
  );
}

/** Skeleton Table Row */
export function SkeletonTableRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "14px 10px" }}>
              <SkeletonBlock width={j === 0 ? "80%" : "60%"} height="11px" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** AI Generation Skeleton — dùng khi đang generate onboarding plan */
export function SkeletonAIGeneration() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SkeletonBlock width="140px" height="14px" />
        <SkeletonBlock width="80px" height="20px" radius="6px" />
      </div>
      <div className="generated-stats" style={{ border: "1px solid var(--line)", borderRadius: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: 12, textAlign: "center" }}>
            <SkeletonBlock width="50px" height="20px" radius="4px" className="mx-auto" style={{ margin: "0 auto 6px" }} />
            <SkeletonBlock width="60px" height="10px" radius="4px" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
          <SkeletonBlock width="90px" height="12px" />
          <div style={{ flex: 1 }}><SkeletonBlock height="6px" radius="10px" /></div>
          <SkeletonBlock width="20px" height="20px" radius="50%" />
        </div>
      ))}
    </div>
  );
}

