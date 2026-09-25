// The private preview entry page only exists while the gate is on AND a key is set.
module.exports = {
  eleventyExcludeFromCollections: true,
  eleventyComputed: {
    permalink: (data) => (data.privatePreview.enabled ? data.privatePreview.path : false),
  },
};
