import { describe, expect, it } from "vitest";
import { formatTeamDisplay, getVenueDisplay } from "./teamDisplay";

describe("team display helpers", () => {
  it("renders Chinese team names with flags for schedule cards", () => {
    expect(formatTeamDisplay("Côte d'Ivoire")).toBe("科特迪瓦 🇨🇮");
    expect(formatTeamDisplay({ name: "United States", code: "USA" })).toBe("美国 🇺🇸");
    expect(formatTeamDisplay("Germany")).toBe("德国 🇩🇪");
  });

  it("renders Chinese venue names", () => {
    expect(getVenueDisplay("Philadelphia Stadium")).toBe("费城体育场");
    expect(getVenueDisplay("New York New Jersey Stadium")).toBe("纽约/新泽西体育场");
  });
});
