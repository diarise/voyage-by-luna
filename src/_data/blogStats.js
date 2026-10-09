// Published Journal stories per destination, read from each post's front matter.
// Used to keep thin destination hubs (fewer than 2 stories) out of search results
// and the sitemap until there's more to show; they still exist and stay linked.
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const dir = path.join(__dirname, "../blog/posts");
  const destCount = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const fm = (fs.readFileSync(path.join(dir, file), "utf8").split("\n---\n")[0]) || "";
    if (/^draft:\s*true\s*$/m.test(fm)) continue;
    const m = fm.match(/^destinations:\s*\[(.*)\]\s*$/m);
    for (const d of (m ? m[1].split(",") : []).map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)) {
      destCount[d] = (destCount[d] || 0) + 1;
    }
  }
  return { destCount, minStoriesToIndex: 2 };
};
