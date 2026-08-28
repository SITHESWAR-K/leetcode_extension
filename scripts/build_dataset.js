const fs = require('fs');
const path = require('path');

const RAW_DATA_DIR = path.join(__dirname, '..', 'raw_data');
const OUT_DIR = path.join(__dirname, '..', 'src', 'data');

// Timeframe file mapping
const TIMEFRAME_MAP = {
  'thirty-days.csv': '30d',
  'three-months.csv': '3m',
  'six-months.csv': '6m',
  'more-than-six-months.csv': '>6m',
  'all.csv': 'all'
};

// Known company brand name casing overrides
const COMPANY_NAME_OVERRIDES = {
  'google': 'Google',
  'meta': 'Meta',
  'amazon': 'Amazon',
  'microsoft': 'Microsoft',
  'apple': 'Apple',
  'netflix': 'Netflix',
  'uber': 'Uber',
  'bloomberg': 'Bloomberg',
  'adobe': 'Adobe',
  'linkedin': 'LinkedIn',
  'tiktok': 'TikTok',
  'bytedance': 'ByteDance',
  'goldman-sachs': 'Goldman Sachs',
  'jpmorgan': 'JPMorgan Chase',
  'morgan-stanley': 'Morgan Stanley',
  'twitter': 'Twitter / X',
  'x': 'X (Twitter)',
  'salesforce': 'Salesforce',
  'stripe': 'Stripe',
  'airbnb': 'Airbnb',
  'oracle': 'Oracle',
  'spotify': 'Spotify',
  'snap': 'Snapchat',
  'pinterest': 'Pinterest',
  'lyft': 'Lyft',
  'doordash': 'DoorDash',
  'robinhood': 'Robinhood',
  'palantir': 'Palantir',
  'nvidia': 'Nvidia',
  'intel': 'Intel',
  'cisco': 'Cisco',
  'walmart-labs': 'Walmart Labs',
  'walmart': 'Walmart',
  'paypal': 'PayPal',
  'ebay': 'eBay',
  'square': 'Block / Square',
  'block': 'Block',
  'snapchat': 'Snapchat',
  'snowflake': 'Snowflake',
  'databricks': 'Databricks',
  'citadel': 'Citadel',
  'two-sigma': 'Two Sigma',
  'jane-street': 'Jane Street',
  'de-shaw': 'D. E. Shaw',
  'hudson-river-trading': 'Hudson River Trading',
  'optiver': 'Optiver',
  'atlassian': 'Atlassian',
  'vmware': 'VMware',
  'ibm': 'IBM',
  'qualcomm': 'Qualcomm',
  'samsung': 'Samsung',
  'yahoo': 'Yahoo',
  'coinbase': 'Coinbase',
  'instacart': 'Instacart',
  'intuit': 'Intuit',
  'zoox': 'Zoox',
  'waymo': 'Waymo',
  'cruise': 'Cruise',
  'tesla': 'Tesla',
  'zoom': 'Zoom',
  'twilio': 'Twilio',
  'splunk': 'Splunk',
  'servicenow': 'ServiceNow',
  'roblox': 'Roblox',
  'asana': 'Asana',
  'dropbox': 'Dropbox',
  'box': 'Box',
  'zillow': 'Zillow',
  'yelp': 'Yelp',
  'affirm': 'Affirm'
};

function formatCompanyName(slug) {
  if (COMPANY_NAME_OVERRIDES[slug]) {
    return COMPANY_NAME_OVERRIDES[slug];
  }
  return slug
    .split('-')
    .map(word => {
      if (word.length <= 3 && !['and', 'for', 'the', 'of'].includes(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Robust CSV parser supporting quotes & multiline commas
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line) => {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    return row;
  };

  const header = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const idIdx = header.findIndex(h => h === 'id' || h === 'question id' || h === '#');
  const urlIdx = header.findIndex(h => h === 'url' || h === 'link');
  const titleIdx = header.findIndex(h => h === 'title' || h === 'name' || h === 'question title');
  const diffIdx = header.findIndex(h => h === 'difficulty' || h === 'level');
  const accIdx = header.findIndex(h => h.includes('acceptance'));
  const freqIdx = header.findIndex(h => h.includes('frequency'));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    if (parts.length <= 1) continue;

    const id = idIdx !== -1 ? parseInt(parts[idIdx], 10) : null;
    const url = urlIdx !== -1 ? parts[urlIdx] : '';
    const title = titleIdx !== -1 ? parts[titleIdx] : '';
    const difficulty = diffIdx !== -1 ? parts[diffIdx] : 'Medium';
    const acceptance = accIdx !== -1 ? parts[accIdx] : '';
    const rawFreq = freqIdx !== -1 ? parts[freqIdx] : '0%';

    // Extract slug
    let slug = '';
    const match = url.match(/\/problems\/([^\/\?#]+)/);
    if (match) {
      slug = match[1].toLowerCase().trim();
    } else if (title) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    if (!slug) continue;

    // Parse frequency float
    const freqMatch = rawFreq.match(/([\d\.]+)/);
    const freq = freqMatch ? parseFloat(freqMatch[1]) : 0;

    rows.push({
      id: isNaN(id) ? null : id,
      slug,
      title: title.replace(/^"|"$/g, '').trim(),
      difficulty: difficulty.trim() || 'Medium',
      acceptance: acceptance.trim(),
      freq: Math.round(freq * 10) / 10
    });
  }

  return rows;
}

function buildDatasets() {
  console.log('🚀 Starting LeetCode Company Data Extraction...');

  if (!fs.existsSync(RAW_DATA_DIR)) {
    console.error(`❌ Raw data directory not found at: ${RAW_DATA_DIR}`);
    process.exit(1);
  }

  const companyDirs = fs.readdirSync(RAW_DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'));

  console.log(`Found ${companyDirs.length} company folders.`);

  // In-memory structures
  // problemMap: slug -> { id, title, difficulty, acceptance, companies: Map(companySlug -> { name, slug, freq, timeframes: Set }) }
  const problemMap = new Map();
  // companyMap: companySlug -> { name, slug, problemsMap: Map(slug -> { id, title, slug, difficulty, acceptance, freq, timeframes: Set }) }
  const companyMap = new Map();

  let totalParsedFiles = 0;

  for (const dir of companyDirs) {
    const companySlug = dir.name;
    const companyName = formatCompanyName(companySlug);
    const dirPath = path.join(RAW_DATA_DIR, companySlug);
    const files = fs.readdirSync(dirPath);

    if (!companyMap.has(companySlug)) {
      companyMap.set(companySlug, {
        name: companyName,
        slug: companySlug,
        problemsMap: new Map()
      });
    }
    const currentCompany = companyMap.get(companySlug);

    for (const file of files) {
      if (!TIMEFRAME_MAP[file]) continue;
      const tf = TIMEFRAME_MAP[file];
      const filePath = path.join(dirPath, file);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const rows = parseCSV(content);
        totalParsedFiles++;

        for (const row of rows) {
          const { id, slug, title, difficulty, acceptance, freq } = row;

          // 1. Update Problem Map
          if (!problemMap.has(slug)) {
            problemMap.set(slug, {
              id: id,
              title: title,
              slug: slug,
              difficulty: difficulty,
              acceptance: acceptance,
              companiesMap: new Map()
            });
          }
          const pEntry = problemMap.get(slug);
          if (!pEntry.id && id) pEntry.id = id;
          if (!pEntry.title && title) pEntry.title = title;
          if (!pEntry.acceptance && acceptance) pEntry.acceptance = acceptance;

          if (!pEntry.companiesMap.has(companySlug)) {
            pEntry.companiesMap.set(companySlug, {
              name: companyName,
              slug: companySlug,
              freq: freq,
              timeframes: new Set()
            });
          }
          const pComp = pEntry.companiesMap.get(companySlug);
          pComp.timeframes.add(tf);
          if (freq > pComp.freq) {
            pComp.freq = freq;
          }

          // 2. Update Company Map
          if (!currentCompany.problemsMap.has(slug)) {
            currentCompany.problemsMap.set(slug, {
              id: id,
              title: title,
              slug: slug,
              difficulty: difficulty,
              acceptance: acceptance,
              freq: freq,
              timeframes: new Set()
            });
          }
          const cProb = currentCompany.problemsMap.get(slug);
          cProb.timeframes.add(tf);
          if (freq > cProb.freq) {
            cProb.freq = freq;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Warning reading ${filePath}:`, err.message);
      }
    }
  }

  console.log(`✅ Parsed ${totalParsedFiles} CSV files across ${companyMap.size} companies.`);
  console.log(`Found ${problemMap.size} unique LeetCode problems with company tags.`);

  // Prepare output objects
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. problem_to_companies.json
  const problemToCompaniesOut = {};
  for (const [slug, data] of problemMap.entries()) {
    const companies = Array.from(data.companiesMap.values()).map(c => ({
      name: c.name,
      slug: c.slug,
      freq: c.freq,
      timeframes: Array.from(c.timeframes)
    }));
    // Sort companies by frequency desc, then name
    companies.sort((a, b) => b.freq - a.freq || a.name.localeCompare(b.name));

    problemToCompaniesOut[slug] = {
      id: data.id,
      title: data.title,
      slug: slug,
      difficulty: data.difficulty,
      acceptance: data.acceptance,
      companiesCount: companies.length,
      companies: companies
    };
  }

  // 2. company_to_problems.json & companies_meta.json
  const companyToProblemsOut = {};
  const companiesMeta = [];

  for (const [cSlug, data] of companyMap.entries()) {
    const problems = Array.from(data.problemsMap.values()).map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      acceptance: p.acceptance,
      freq: p.freq,
      timeframes: Array.from(p.timeframes)
    }));

    // Sort problems by frequency desc
    problems.sort((a, b) => b.freq - a.freq || (a.id || 99999) - (b.id || 99999));

    companyToProblemsOut[cSlug] = {
      name: data.name,
      slug: cSlug,
      total: problems.length,
      problems: problems
    };

    let easyCount = 0, medCount = 0, hardCount = 0;
    for (const p of problems) {
      const d = (p.difficulty || '').toLowerCase();
      if (d === 'easy') easyCount++;
      else if (d === 'medium') medCount++;
      else if (d === 'hard') hardCount++;
    }

    if (problems.length > 0) {
      companiesMeta.push({
        name: data.name,
        slug: cSlug,
        total: problems.length,
        easy: easyCount,
        medium: medCount,
        hard: hardCount
      });
    }
  }

  // Sort companies meta by total question count desc
  companiesMeta.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  // Write JSON files
  const p2cPath = path.join(OUT_DIR, 'problem_to_companies.json');
  const c2pPath = path.join(OUT_DIR, 'company_to_problems.json');
  const cMetaPath = path.join(OUT_DIR, 'companies_meta.json');

  console.log('Writing output JSON files...');
  fs.writeFileSync(p2cPath, JSON.stringify(problemToCompaniesOut));
  fs.writeFileSync(c2pPath, JSON.stringify(companyToProblemsOut));
  fs.writeFileSync(cMetaPath, JSON.stringify(companiesMeta, null, 2));

  const p2cSize = (fs.statSync(p2cPath).size / 1024 / 1024).toFixed(2);
  const c2pSize = (fs.statSync(c2pPath).size / 1024 / 1024).toFixed(2);
  const cMetaSize = (fs.statSync(cMetaPath).size / 1024).toFixed(2);

  console.log(`🎉 Build complete!`);
  console.log(`📁 ${p2cPath} (${p2cSize} MB)`);
  console.log(`📁 ${c2pPath} (${c2pSize} MB)`);
  console.log(`📁 ${cMetaPath} (${cMetaSize} KB)`);
  console.log(`📊 Top 10 Companies by Question Count:`);
  companiesMeta.slice(0, 10).forEach((c, idx) => {
    console.log(`   ${idx + 1}. ${c.name} (${c.total} problems: ${c.easy}E / ${c.medium}M / ${c.hard}H)`);
  });
}

buildDatasets();
