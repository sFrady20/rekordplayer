// Stub for kaitai-struct's Node-only iconv-lite fallback. Never reached at
// runtime: parse.ts replaces KaitaiStream.bytesToStr with a pure-JS decoder.
module.exports = {
  decode() {
    throw new Error('iconv-lite stub: bytesToStr override missing');
  },
};
