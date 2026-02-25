const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    useWatchman: false,
    resolveRequest: (context, moduleName, platform) => {
      // Force axios to use browser build (avoids Node crypto/http imports)
      if (moduleName === 'axios') {
        return context.resolveRequest(context, 'axios/dist/browser/axios.cjs', platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
