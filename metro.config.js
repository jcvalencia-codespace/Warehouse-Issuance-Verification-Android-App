const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  __dirname + '/node_modules',
];

if (config.transformer) {
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });
}

module.exports = config;
