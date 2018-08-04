const path = require("path");

module.exports = (baseConfig, env, defaultConfig) => {
  defaultConfig.module.rules.push({
    test: /\.stories\.tsx?$/,
    loaders: [
      {
        loader: require.resolve("@storybook/addon-storysource/loader"),
        options: { parser: "typescript" },
      },
    ],
    enforce: "pre",
  });

  defaultConfig.module.rules.push({
    test: /.*\.(ts|tsx)$/,
    loader: require.resolve("light-ts-loader"),
  });

  defaultConfig.resolve.extensions.push(".ts", ".tsx");

  return defaultConfig;
};
