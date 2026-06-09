const FIELD_ALIASES = Object.freeze({
  matchId: ["matchId", "matchIds", "match_ids"],
  teamId: ["teamId", "teamIds", "team_ids"],
  playerId: ["playerId", "playerIds", "player_ids"],
  sourceType: ["sourceType", "source_type"],
  publishedAt: ["publishedAt", "published_at"],
  url: ["url", "source_url"],
  competition: ["competition", "tournament_stage"]
});

export function matchesMetadataFilters(metadata, filters = {}) {
  return Object.entries(filters).every(([key, expected]) => {
    if (expected === undefined || expected === null || expected === "") {
      return true;
    }

    const actualValues = valuesForKey(metadata, key);
    const expectedValues = Array.isArray(expected) ? expected : [expected];

    return expectedValues.some((expectedValue) =>
      actualValues.some((actualValue) => String(actualValue) === String(expectedValue))
    );
  });
}

export function valuesForKey(metadata, key) {
  const aliases = FIELD_ALIASES[key] ?? [key];
  const values = [];

  for (const alias of aliases) {
    const value = metadata?.[alias];
    if (Array.isArray(value)) {
      values.push(...value);
    } else if (value !== undefined && value !== null) {
      values.push(value);
    }
  }

  return values;
}
