// Works out whether the public launch gate is on for THIS build.
// The only switch to edit is src/_data/launch.json ("mode").
//
// - mode "live"                -> gate off, the full site is public.
// - anything else              -> gate on (fails safe: a typo keeps the site hidden).
// - Netlify deploy previews    -> gate off, so the owners can review the real site;
//                                 those pages are also marked noindex (see base.njk).
const launch = require("./launch.json");

module.exports = function () {
  const live = launch.mode === "live";
  const deployPreview = process.env.CONTEXT === "deploy-preview";
  return {
    live,
    active: !live && !deployPreview,
    previewBypass: !live && deployPreview,
  };
};
