/**
 * Strips MongoDB operator keys ($gt, $ne, ...) and dotted paths from the
 * request body, blocking operator-injection payloads such as
 *   { "email": { "$gt": "" } }
 * which would otherwise turn User.findOne({ email }) into a match-anything query.
 *
 * Deliberately only touches req.body: in Express 5 req.query is a getter with
 * no setter, so the popular express-mongo-sanitize package throws on assignment.
 */
const scrub = (value, depth = 0) => {
  if (depth > 10 || value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
    } else {
      value[key] = scrub(value[key], depth + 1);
    }
  }
  return value;
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") scrub(req.body);
  next();
};

module.exports = { sanitizeBody };
