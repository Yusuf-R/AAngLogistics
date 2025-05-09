// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);
const {
    resolver: { assetExts, sourceExts, ...restResolver },
    transformer,
    ...restConfig
} = defaultConfig;

// Create your SVG transform config
const svgConfig = {
    transformer: {
        ...transformer,
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
        ...restResolver,
        // Remove 'svg' from assetExts and add it to sourceExts
        assetExts: assetExts.filter(ext => ext !== 'svg'),
        sourceExts: [...sourceExts, 'svg'],
    },
};

// Merge it all together
const mergedConfig = mergeConfig(
    { ...restConfig, transformer: transformer, resolver: restResolver },
    svgConfig
);

// Finally wrap with NativeWind
module.exports = withNativeWind(mergedConfig, {
    input: './app/global.css',
});
