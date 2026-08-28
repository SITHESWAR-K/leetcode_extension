const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'web', 'dist');
const dashboardDir = path.join(__dirname, '..', 'src', 'dashboard');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(distDir, dashboardDir);
console.log('Successfully synced web/dist to src/dashboard/');
