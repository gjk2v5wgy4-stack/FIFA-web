export function identityRerank(results) {
  return Array.isArray(results) ? [...results] : [];
}
