const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

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

const isWeb = (process.env.EXPO_OS || '').toLowerCase() === 'web' || process.argv.includes('--web');
if (isWeb) {
  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    'react-native-reanimated': path.resolve(__dirname, 'src/mocks/reanimated.web.js'),
    'react-native-worklets': path.resolve(__dirname, 'src/mocks/worklets.web.js'),
  };
}

module.exports = config;
