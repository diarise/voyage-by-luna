const path = require("path");
const Image = require("@11ty/eleventy-img");
const pluginRss = require("@11ty/eleventy-plugin-rss");

// Dates are shown in the timezone the old Jekyll blog used, so published dates
// (and the dates in the old URLs) stay the same after the migration.
const TZ = "America/Los_Angeles";

// Affiliate links get rel="sponsored" (and trigger the disclosure note).
const AFFILIATE = /advisor_token=|viator\.com|amazon\.|amzn\.to|tag=soukeyna/i;

function youtubeId(url) {
  const m = String(url || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function youtubeEmbed(id, title) {
  const label = title ? `Play video: ${title}` : "Play video";
  return `<figure class="video-embed" data-youtube="${id}">` +
    `<a class="video-facade" href="https://www.youtube.com/watch?v=${id}" aria-label="${label.replace(/"/g, "&quot;")}">` +
    `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">` +
    `<span class="video-play" aria-hidden="true"></span></a></figure>`;
}

// Responsive images for blog/CMS photos: <img> -> <picture> with WebP + original
// format at a few widths. Runs on the built HTML so it also covers images inside
// Markdown and images Soukeyna uploads through the CMS later.
const IMG_SRC = /^\/images\/(blog|uploads)\//;
async function pictureFor(src, attrs) {
  const file = path.join(__dirname, decodeURI(src));
  const isHero = /\bdata-hero\b/.test(attrs);
  const meta = await Image(file, {
    widths: isHero ? [640, 1024, 1600] : [480, 800, 1200],
    formats: ["webp", "auto"],
    outputDir: path.join(__dirname, "_site/img/"),
    urlPath: "/img/",
    sharpJpegOptions: { quality: 78, progressive: true },
    sharpWebpOptions: { quality: 76 },
    sharpPngOptions: { compressionLevel: 9 },
  });
  const get = (name) => { const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`)); return m ? m[1] : undefined; };
  const html = {
    alt: get("alt") || "",
    sizes: get("data-sizes") || "(min-width: 760px) 720px, 100vw",
    loading: isHero ? "eager" : "lazy",
    decoding: "async",
  };
  if (isHero) html.fetchpriority = "high";
  const cls = get("class"); if (cls) html.class = cls;
  let out = Image.generateHTML(meta, html);
  const title = get("title");
  if (title) out = out.replace("<img ", `<img title="${title}" `);
  return out;
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("CNAME");
  // Google Search Console verification for blog.voyagebyluna.com (kept after the move)
  eleventyConfig.addPassthroughCopy("google83dbb073897b0fa1.html");

  eleventyConfig.addPlugin(pluginRss);

  // ---------------------------------------------------------------- blog data
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/posts/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("blogDate", (d) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "long", day: "numeric" }).format(new Date(d)));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });
  eleventyConfig.addFilter("inSection", (posts, slug) => (posts || []).filter((p) => p.data.section === slug));
  eleventyConfig.addFilter("inDestination", (posts, slug) =>
    (posts || []).filter((p) => (p.data.destinations || []).includes(slug)));
  eleventyConfig.addFilter("findBySlug", (list, slug) => (list || []).find((x) => x.slug === slug));
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("featuredOnly", (posts) => (posts || []).filter((p) => p.data.featured));
  eleventyConfig.addFilter("except", (posts, url) => (posts || []).filter((p) => p.url !== url));
  // Related: shared destination beats shared section beats shared keyword; newest breaks ties.
  eleventyConfig.addFilter("related", (posts, current, n = 3) => {
    const d = current.destinations || [], k = current.keywords || [];
    return (posts || [])
      .filter((p) => p.url !== current.page.url)
      .map((p) => ({ p, score:
        3 * (p.data.destinations || []).filter((x) => d.includes(x)).length +
        2 * (p.data.section === current.section ? 1 : 0) +
        (p.data.keywords || []).filter((x) => k.includes(x)).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.date - a.p.date)
      .slice(0, n).map((x) => x.p);
  });
  // Table of contents from the rendered article (ids are added by the markdown setup below)
  eleventyConfig.addFilter("toc", (html) =>
    [...String(html || "").matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)]
      .map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") })));
  eleventyConfig.addFilter("youtubeEmbed", (url, title) => { const id = youtubeId(url); return id ? youtubeEmbed(id, title) : ""; });
  eleventyConfig.addFilter("jsonString", (s) => JSON.stringify(String(s || "")));

  // Heading anchors so long articles can have a table of contents
  eleventyConfig.amendLibrary("md", (md) => {
    const slugify = eleventyConfig.getFilter("slugify");
    md.core.ruler.push("heading_ids", (state) => {
      const used = new Set();
      state.tokens.forEach((tok, i) => {
        if (tok.type !== "heading_open" || !/^h[23]$/.test(tok.tag)) return;
        let id = slugify(state.tokens[i + 1].content) || "section", base = id, n = 2;
        while (used.has(id)) id = `${base}-${n++}`;
        used.add(id); tok.attrSet("id", id);
      });
    });
  });

  // ---------------------------------------------------------------- HTML post-processing
  eleventyConfig.addTransform("blog-html", async function(content) {
    const out = this.page.outputPath || "";
    if (!out.endsWith(".html")) return content;
    let html = content;

    if (this.page.url.startsWith("/blog/")) {
      // A YouTube link on its own line becomes a click-to-load player
      html = html.replace(/<p>\s*(?:<a [^>]*>)?(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<]+)(?:<\/a>)?\s*<\/p>/g,
        (m, url) => { const id = youtubeId(url); return id ? youtubeEmbed(id) : m; });
      // Outbound links in articles open in a new tab; affiliate links are marked sponsored
      html = html.replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*\brel=)/g, (m, href) => {
        if (/^https?:\/\/(www\.)?voyagebyluna\.com/.test(href)) return m;
        const rel = AFFILIATE.test(href) ? "sponsored nofollow noopener" : "noopener";
        return `<a href="${href}" target="_blank" rel="${rel}"`;
      });
    }

    // Responsive images (blog + CMS uploads, anywhere on the site)
    const jobs = [];
    html.replace(/<img\s([^>]*?)src="([^"]+)"([^>]*)>/g, (m, a, src, b) => {
      if (IMG_SRC.test(src) && !/\.svg$/i.test(src)) jobs.push({ m, src, attrs: a + b });
      return m;
    });
    for (const j of jobs) {
      try { html = html.replace(j.m, await pictureFor(j.src, j.attrs)); }
      catch (e) { console.warn(`[images] ${j.src}: ${e.message}`); }
    }
    return html;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
