import { describe, expect, it } from "vitest";
import { jobPercent, STEPS } from "../src/components/path/GenerationProgress";

const job = (steps, modules = [], status = "running") => ({ status, state: { steps: Object.fromEntries(STEPS.map(s => [s, steps[s] || "pending"])), modules } });

describe("jobPercent — phần trăm theo tiến độ thật của job", () => {
  it("starts near zero and never shows 100% before the job is done", () => {
    expect(jobPercent(null)).toBe(0);
    expect(jobPercent(job({ sources: "active" }))).toBe(3);
    const almost = job({ sources: "done", analysis: "done", plan: "done", modules: "done", coverage: "done", saving: "active" });
    expect(jobPercent(almost)).toBe(98);
    expect(jobPercent({ ...almost, status: "done" })).toBe(100);
  });

  it("moves with each module's phase, the slowest part of a run", () => {
    const base = { sources: "done", analysis: "done", plan: "done", modules: "active" };
    const phases = p => job(base, [{ phase: p[0] }, { phase: p[1] }]);
    const waiting = jobPercent(phases(["waiting", "waiting"]));
    const writing = jobPercent(phases(["quiz", "lessons"]));
    const finished = jobPercent(phases(["done", "fallback"]));
    expect(waiting).toBe(15);
    expect(writing).toBeGreaterThan(waiting);
    expect(finished).toBe(90);
  });

  it("counts skipped steps as passed", () => {
    expect(jobPercent(job({ sources: "done", analysis: "skipped", plan: "skipped", modules: "skipped", coverage: "skipped", saving: "active" }))).toBe(98);
  });
});

describe("llmErrorLabel — mã lỗi AI thành câu dễ hiểu", () => {
  const dict = { llm_error_QUOTA_EXCEEDED: "hết hạn mức", llm_error_BLOCKED: "bị chặn" };
  const t = key => dict[key] ?? key;

  it("translates known codes, groups every BLOCKED_* reason, keeps unknown codes", async () => {
    const { llmErrorLabel } = await import("../src/components/path/GenerationProgress");
    expect(llmErrorLabel(t, "QUOTA_EXCEEDED")).toBe("hết hạn mức");
    expect(llmErrorLabel(t, "BLOCKED_SAFETY")).toBe("bị chặn");
    expect(llmErrorLabel(t, "SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(llmErrorLabel(t, null)).toBe("");
  });
});
