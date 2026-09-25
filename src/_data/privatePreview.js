// Private preview of the complete site while the launch gate is on.
//
// The key is read ONLY from the Netlify environment variable VBL_PREVIEW_KEY
// (Site configuration -> Environment variables). It is never committed: the
// GitHub repo is public. No key, or a weak one -> no preview path is built.
//
// Visiting https://voyagebyluna.com/<key>/ sets a browser cookie; requests that
// carry it skip the Coming Soon gate (see src/redirects.njk). With the site in
// "live" mode this does nothing at all.
const gate = require("./launchGate.js")();

const key = (process.env.VBL_PREVIEW_KEY || "").trim();
const valid = /^[a-z0-9]{32,64}$/.test(key);
if (key && !valid) {
  console.warn("[private preview] VBL_PREVIEW_KEY ignored: use 32-64 lowercase letters/digits.");
}

module.exports = {
  enabled: gate.active && valid,
  path: valid ? `/${key}/` : null,
  cookie: valid ? `vbl_pv_${key}` : null,
};
