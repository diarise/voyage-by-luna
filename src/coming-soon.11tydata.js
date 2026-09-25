// The Coming Soon page only exists while the launch gate is on (src/_data/launch.json).
module.exports = {
  eleventyComputed: {
    permalink: (data) => (data.launchGate.active ? "/coming-soon/" : false),
  },
};
