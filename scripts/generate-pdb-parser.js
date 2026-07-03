/**
 * Downloads the rekordbox_pdb.ksy Kaitai Struct definition from
 * Deep-Symmetry/crate-digger and compiles it to a JavaScript parser,
 * vendored into src/lib/pdb/RekordboxPdb.js.
 *
 * Run: node scripts/generate-pdb-parser.js
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const KaitaiStructCompiler = require('kaitai-struct-compiler');

const KSY_URL =
  'https://raw.githubusercontent.com/Deep-Symmetry/crate-digger/main/src/main/kaitai/rekordbox_pdb.ksy';
const OUT_DIR = path.join(__dirname, '..', 'src', 'lib', 'pdb');

async function main() {
  console.log('Downloading', KSY_URL);
  const res = await fetch(KSY_URL);
  if (!res.ok) throw new Error(`Failed to download ksy: ${res.status}`);
  const ksyText = await res.text();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'rekordbox_pdb.ksy'), ksyText);

  const ksy = yaml.load(ksyText);
  console.log('Compiling with kaitai-struct-compiler', KaitaiStructCompiler.version);
  const files = await KaitaiStructCompiler.compile('javascript', ksy, null, false);
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT_DIR, name), content);
    console.log('Wrote', path.join('src/lib/pdb', name), `(${content.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
