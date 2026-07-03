const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// kaitai-struct has a Node-only `require('iconv-lite')` fallback that Metro
// tries to resolve statically; it is never executed (see src/lib/pdb/parse.ts).
config.resolver.extraNodeModules = {
  'iconv-lite': require.resolve('./src/lib/pdb/iconv-lite-stub.js'),
  zlib: require.resolve('./src/lib/pdb/iconv-lite-stub.js'), // pdb files are never zlib-compressed
};

module.exports = withNativeWind(config, { input: './src/global.css' });
