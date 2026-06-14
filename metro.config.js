const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// react-native-svg's package.json has "react-native": "src/index.ts" which points
// Metro to the raw TypeScript source. The TS source uses internal imports like
// "../lib/extract/extractBrush" that resolve to paths Metro cannot follow.
// Redirect to the pre-compiled CJS build instead.
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native-svg/lib/commonjs/index.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
