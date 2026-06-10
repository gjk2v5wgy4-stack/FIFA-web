import { describe, expect, it } from "vitest";
import { formatTeamDisplay, getTeamDisplay, getVenueDisplay } from "./teamDisplay";

describe("team display helpers", () => {
  it("renders Chinese team names and flag image URLs for schedule cards", () => {
    expect(formatTeamDisplay("Côte d'Ivoire")).toBe("科特迪瓦");
    expect(formatTeamDisplay({ name: "United States", code: "USA" })).toBe("美国");
    expect(formatTeamDisplay("Germany")).toBe("德国");
    expect(formatTeamDisplay("Mexico")).toBe("墨西哥");
    expect(formatTeamDisplay("South Korea")).toBe("韩国");

    expect(getTeamDisplay("Mexico").flagImageUrl).toBe("https://flagcdn.com/w40/mx.png");
    expect(getTeamDisplay("England").flagImageUrl).toBe(
      "https://flagcdn.com/w40/gb-eng.png",
    );
  });

  it("renders Chinese venue names", () => {
    expect(getVenueDisplay("Philadelphia Stadium")).toBe("费城体育场");
    expect(getVenueDisplay("New York New Jersey Stadium")).toBe("纽约/新泽西体育场");
    expect(getVenueDisplay("Mexico City")).toBe("墨西哥城");
  });
});
