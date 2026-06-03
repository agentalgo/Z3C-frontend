import { readdirSync, readFileSync, writeFileSync } from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';
import path from 'path';

/**
 * Browser-safe obfuscation profile:
 * - renameProperties/transformObjectKeys OFF  → API field names and React prop shapes survive
 * - selfDefending OFF                         → incompatible with bundled browser code
 * - deadCodeInjection OFF                     → keeps bundle size reasonable
 * - stringArray + base64 encoding             → obscures string literals
 * - identifierNamesGenerator: mangled         → short mangled names
 * - controlFlowFlattening: modest (0.3)       → slows reverse-engineering without bloating output
 */
const OBFUSCATOR_OPTIONS = {
  target: 'browser',
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  identifierNamesGenerator: 'mangled',
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.3,
  renameProperties: false,
  transformObjectKeys: false,
  selfDefending: false,
  deadCodeInjection: false,
  sourceMap: false,
  debugProtection: false,
  disableConsoleOutput: false,
};

const distAssetsDir = path.resolve('dist', 'assets');

const jsFiles = readdirSync(distAssetsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => path.join(distAssetsDir, f));

if (jsFiles.length === 0) {
  console.error('No JS files found in dist/assets — did vite build run?');
  process.exit(1);
}

for (const filePath of jsFiles) {
  const source = readFileSync(filePath, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(source, OBFUSCATOR_OPTIONS);
  writeFileSync(filePath, result.getObfuscatedCode(), 'utf8');
  console.log(`Obfuscated: ${path.relative('dist', filePath)}`);
}

console.log(`\nDone — ${jsFiles.length} file(s) obfuscated in dist/assets/`);
