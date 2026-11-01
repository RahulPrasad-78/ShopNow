// Vercel entry point: every /api/* request is routed here (see vercel.json).
// The Express app is exported by backend/index.js; it only calls listen() when
// run directly (npm run dev), so requiring it here does not open a port.
module.exports = require("../backend/index.js");
