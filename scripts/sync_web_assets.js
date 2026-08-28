const fs = require('fs');
const path = require('path');

const srcData = path.join(__dirname, '..', 'src', 'data');
const srcAssets = path.join(__dirname, '..', 'src', 'assets');
const pubData = path.join(__dirname, '..', 'web', 'public', 'data');
const pub = path.join(__dirname, '..', 'web', 'public');

if (!fs.existsSync(pubData)) {
  fs.mkdirSync(pubData, { recursive: true });
}

['problem_to_companies.json', 'company_to_problems.json', 'companies_meta.json'].forEach(f => {
  fs.copyFileSync(path.join(srcData, f), path.join(pubData, f));
  console.log(`Copied ${f} to web/public/data/`);
});

['icon16.png', 'icon48.png', 'icon128.png'].forEach(f => {
  fs.copyFileSync(path.join(srcAssets, f), path.join(pub, f));
  console.log(`Copied ${f} to web/public/`);
});
