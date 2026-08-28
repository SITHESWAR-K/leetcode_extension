const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging Chrome Extension for Web Store Release...');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'release');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const zipName = 'leetcode-company-tags-extension-v1.0.0.zip';
const zipPath = path.join(DIST_DIR, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Files and folders to include in the extension bundle
const includes = [
  'manifest.json',
  'src'
];

try {
  // Use PowerShell Compress-Archive to build zip on Windows
  const srcPaths = includes.map(f => `'${path.join(ROOT_DIR, f)}'`).join(',');
  const cmd = `Compress-Archive -Path ${srcPaths} -DestinationPath '${zipPath}' -Force`;
  execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });

  const size = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n🎉 Release zip created successfully!`);
  console.log(`📁 ${zipPath} (${size} MB)`);
  console.log(`\nYou can now upload this .zip file directly to the Chrome Web Store Developer Dashboard!`);
} catch (err) {
  console.error('Error creating release zip:', err.message);
}
