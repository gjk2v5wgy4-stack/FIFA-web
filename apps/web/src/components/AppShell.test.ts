import { describe, expect, it } from "vitest";
import { LEGAL_DISCLAIMER_TEXT } from "./AppShell";

describe("AppShell legal disclaimer", () => {
  it("keeps the required entertainment and anti-gambling notice available globally", () => {
    expect(LEGAL_DISCLAIMER_TEXT).toBe(
      "本分析仅供体育数据娱乐和战术参考，不构成任何投注或赌博建议。严禁未经授权使用",
    );
    expect(LEGAL_DISCLAIMER_TEXT).toContain("不构成任何投注或赌博建议");
  });
});
