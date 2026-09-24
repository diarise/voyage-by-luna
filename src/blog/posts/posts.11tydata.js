// Every Journal post: layout, clean URL, and SEO fields derived from the CMS fields.
module.exports = {
  layout: "post.njk",
  // Post bodies are plain Markdown written in the CMS — never run them through a
  // template engine, so a stray "{{" in an article can't break the build.
  templateEngineOverride: "md",
  og_type: "article",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/blog/${data.page.fileSlug}/`),
    description: (data) => data.seo_description || data.excerpt,
    seo_title: (data) => data.seo_title || data.title,
    og_image: (data) => data.image,
  },
};
