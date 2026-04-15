export function requireFields(payload, fields = []) {
  const missing = fields.filter((field) => payload?.[field] == null || payload?.[field] === "");
  return missing;
}
