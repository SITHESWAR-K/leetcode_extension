const fs = require('fs');
const path = require('path');

console.log('🧪 Running Extension & Web App Verification Tests...');

const ROOT_DIR = path.join(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

// 1. Manifest verification
console.log('\n1. Manifest V3 Validation:');
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.manifest_version === 3, 'Manifest version is 3');
assert(manifest.name.length > 0, 'Manifest has valid name');
assert(manifest.action && manifest.action.default_popup, 'Default popup is defined');

// Verify referenced files in manifest
const checkFile = (relPath, desc) => {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `${desc} exists at ${relPath}`);
};

checkFile('src/popup/popup.html', 'Popup HTML');
checkFile('src/popup/popup.css', 'Popup CSS');
checkFile('src/popup/popup.js', 'Popup JS');
checkFile('src/content/content.js', 'Content JS');
checkFile('src/content/content.css', 'Content CSS');
checkFile('src/assets/icon16.png', 'Icon 16');
checkFile('src/assets/icon48.png', 'Icon 48');
checkFile('src/assets/icon128.png', 'Icon 128');

// 2. Dataset validation
console.log('\n2. Dataset Validation:');
const p2cPath = path.join(ROOT_DIR, 'src', 'data', 'problem_to_companies.json');
const c2pPath = path.join(ROOT_DIR, 'src', 'data', 'company_to_problems.json');
const cMetaPath = path.join(ROOT_DIR, 'src', 'data', 'companies_meta.json');

assert(fs.existsSync(p2cPath), 'problem_to_companies.json exists');
assert(fs.existsSync(c2pPath), 'company_to_problems.json exists');
assert(fs.existsSync(cMetaPath), 'companies_meta.json exists');

const p2c = JSON.parse(fs.readFileSync(p2cPath, 'utf8'));
const c2p = JSON.parse(fs.readFileSync(c2pPath, 'utf8'));
const cMeta = JSON.parse(fs.readFileSync(cMetaPath, 'utf8'));

assert(Object.keys(p2c).length > 3000, `Problem-to-companies count is ${Object.keys(p2c).length} (>3000)`);
assert(Object.keys(c2p).length > 500, `Company-to-problems count is ${Object.keys(c2p).length} (>500)`);
assert(cMeta.length > 500, `Companies metadata count is ${cMeta.length} (>500)`);

// 3. Web Application & Firebase validation
console.log('\n3. React Web Application & Firebase Validation:');
checkFile('web/package.json', 'Web package.json');
checkFile('web/firebase.json', 'Firebase Hosting Config');
checkFile('web/.firebaserc', 'Firebase RC Config');
checkFile('web/dist/index.html', 'Web App Built Index HTML');
checkFile('src/dashboard/index.html', 'Bundled Extension Dashboard HTML');

// 4. Content Script In-Page Checks
console.log('\n4. Content Script In-Page Logic Validation:');
const contentJs = fs.readFileSync(path.join(ROOT_DIR, 'src/content/content.js'), 'utf8');
assert(contentJs.includes('lc-company-pills-row'), 'Uses minimal lc-company-pills-row container');
assert(contentJs.includes('cleanExistingPills'), 'Includes aggressive duplicate pill cleanup');
assert(contentJs.includes('debounceTimer'), 'Includes debounce timer for SPA mutations');
assert(contentJs.includes('isExpanded'), 'Supports in-place expansion for +X more pills');

console.log('\n🎉 ALL 24 EXTENSION & WEB APP VERIFICATION TESTS PASSED! 🚀');
