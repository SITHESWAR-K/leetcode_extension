/**
 * LeetCode Company Explorer - Popup Script
 */

(function () {
  'use strict';

  // Data references
  let companiesMeta = [];
  let companyToProblems = {};
  let problemToCompanies = {};

  // State
  let activeTab = 'tab-companies';
  let companySearchQuery = '';
  let problemSearchQuery = '';
  let selectedCompanySlug = null;

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const companySearchInput = document.getElementById('company-search-input');
  const popularCompaniesBar = document.getElementById('popular-companies-bar');
  const companiesList = document.getElementById('companies-list');
  
  const problemSearchInput = document.getElementById('problem-search-input');
  const problemsList = document.getElementById('problems-list');

  const settingShowTags = document.getElementById('setting-show-tags');
  const settingShowFilter = document.getElementById('setting-show-filter');
  const settingDefaultTf = document.getElementById('setting-default-timeframe');

  const drawer = document.getElementById('company-drawer');
  const drawerBackBtn = document.getElementById('drawer-back-btn');
  const drawerCompanyTitle = document.getElementById('drawer-company-title');
  const drawerStats = document.getElementById('drawer-stats');
  const drawerProblemsList = document.getElementById('drawer-problems-list');

  // Popular tech companies shortcuts
  const POPULAR_SLUGS = ['google', 'amazon', 'meta', 'microsoft', 'bloomberg', 'apple', 'uber', 'tiktok', 'netflix', 'stripe', 'goldman-sachs'];

  // Initialize
  async function init() {
    setupTabs();
    setupSettings();
    await loadData();
    renderPopularBar();
    renderCompaniesList();
    setupSearchListeners();
  }

  // Load JSON datasets
  async function loadData() {
    try {
      const [metaRes, c2pRes, p2cRes] = await Promise.all([
        fetch(chrome.runtime.getURL('src/data/companies_meta.json')).then(r => r.json()),
        fetch(chrome.runtime.getURL('src/data/company_to_problems.json')).then(r => r.json()),
        fetch(chrome.runtime.getURL('src/data/problem_to_companies.json')).then(r => r.json())
      ]);

      companiesMeta = metaRes;
      companyToProblems = c2pRes;
      problemToCompanies = p2cRes;

      const statsEl = document.getElementById('stats-subtitle');
      if (statsEl) {
        statsEl.textContent = `${companiesMeta.length.toLocaleString()} Companies • ${Object.keys(problemToCompanies).length.toLocaleString()} Problems`;
      }
    } catch (err) {
      console.error('Error loading popup data:', err);
    }
  }

  // Tab switching
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) targetContent.classList.add('active');
        activeTab = targetTab;
      });
    });
  }

  // Popular companies bar
  function renderPopularBar() {
    popularCompaniesBar.innerHTML = POPULAR_SLUGS.map(slug => {
      const comp = companiesMeta.find(c => c.slug === slug);
      if (!comp) return '';
      return `<button class="quick-tag-chip" data-slug="${slug}">${comp.name}</button>`;
    }).join('');

    popularCompaniesBar.querySelectorAll('.quick-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const slug = chip.dataset.slug;
        openCompanyDrawer(slug);
      });
    });
  }

  // Render companies list in Tab 1
  function renderCompaniesList() {
    let filtered = companiesMeta;
    if (companySearchQuery.trim()) {
      const q = companySearchQuery.toLowerCase().trim();
      filtered = companiesMeta.filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q));
    }

    if (filtered.length === 0) {
      companiesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No companies found matching "${companySearchQuery}".</p>
        </div>
      `;
      return;
    }

    const visible = filtered.slice(0, 50); // limit for fast scroll
    companiesList.innerHTML = visible.map(c => {
      const total = c.total || 1;
      const easyPct = ((c.easy || 0) / total) * 100;
      const medPct = ((c.medium || 0) / total) * 100;
      const hardPct = ((c.hard || 0) / total) * 100;

      return `
        <div class="company-card" data-slug="${c.slug}">
          <div class="card-header">
            <span class="company-name">${c.name}</span>
            <span class="company-count">${c.total} questions</span>
          </div>
          
          <div class="diff-bar-container">
            <div class="diff-bar-easy" style="width: ${easyPct}%;"></div>
            <div class="diff-bar-med" style="width: ${medPct}%;"></div>
            <div class="diff-bar-hard" style="width: ${hardPct}%;"></div>
          </div>

          <div class="card-meta">
            <span style="color: var(--easy);">${c.easy} Easy</span>
            <span style="color: var(--medium);">${c.medium} Med</span>
            <span style="color: var(--hard);">${c.hard} Hard</span>
          </div>
        </div>
      `;
    }).join('');

    companiesList.querySelectorAll('.company-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.slug;
        openCompanyDrawer(slug);
      });
    });
  }

  // Open Company Details Drawer
  function openCompanyDrawer(slug) {
    selectedCompanySlug = slug;
    const cData = companyToProblems[slug];
    if (!cData) return;

    drawerCompanyTitle.textContent = cData.name;

    let easy = 0, med = 0, hard = 0;
    cData.problems.forEach(p => {
      const d = (p.difficulty || '').toLowerCase();
      if (d === 'easy') easy++;
      else if (d === 'medium') med++;
      else if (d === 'hard') hard++;
    });

    drawerStats.innerHTML = `
      <span class="diff-pill easy">${easy} Easy</span>
      <span class="diff-pill medium">${med} Med</span>
      <span class="diff-pill hard">${hard} Hard</span>
      <span style="color: var(--text-subtle); margin-left: auto;">${cData.total} Total</span>
    `;

    drawerProblemsList.innerHTML = cData.problems.map(p => {
      const dClass = (p.difficulty || 'Medium').toLowerCase();
      const freqScore = p.freq ? `${p.freq}%` : '';

      return `
        <div class="drawer-prob-row">
          <span style="color: var(--text-subtle); font-size: 11px; width: 32px;">${p.id || '-'}</span>
          <a href="https://leetcode.com/problems/${p.slug}/" target="_blank" class="drawer-prob-title">
            ${p.title}
          </a>
          <span class="diff-pill ${dClass}">${p.difficulty}</span>
          ${freqScore ? `<span class="mini-comp-badge ${p.freq >= 70 ? 'high' : ''}">${freqScore}</span>` : ''}
        </div>
      `;
    }).join('');

    drawer.classList.remove('hidden');
  }

  drawerBackBtn.addEventListener('click', () => {
    drawer.classList.add('hidden');
  });

  // Problem Search in Tab 2
  function renderProblemSearchResults() {
    const q = problemSearchQuery.toLowerCase().trim();
    if (!q) {
      problemsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          <p>Type a problem title or question number to view all companies that asked it.</p>
        </div>
      `;
      return;
    }

    const matches = [];
    for (const [slug, data] of Object.entries(problemToCompanies)) {
      const titleMatch = (data.title || '').toLowerCase().includes(q);
      const idMatch = data.id && String(data.id) === q.replace('#', '');
      const slugMatch = slug.includes(q);

      if (titleMatch || idMatch || slugMatch) {
        matches.push(data);
      }
      if (matches.length >= 25) break;
    }

    if (matches.length === 0) {
      problemsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No questions found matching "${problemSearchQuery}".</p>
        </div>
      `;
      return;
    }

    problemsList.innerHTML = matches.map(p => {
      const dClass = (p.difficulty || 'Medium').toLowerCase();
      const topCompanies = (p.companies || []).slice(0, 8);

      return `
        <div class="problem-card">
          <div class="problem-card-top">
            <a href="https://leetcode.com/problems/${p.slug}/" target="_blank" class="problem-link">
              ${p.id ? `#${p.id} ` : ''}${p.title} ↗
            </a>
            <span class="diff-pill ${dClass}">${p.difficulty}</span>
          </div>

          <div class="problem-companies-wrap">
            ${topCompanies.map(c => `
              <span class="mini-comp-badge ${c.freq >= 70 ? 'high' : ''}">
                ${c.name} ${c.freq ? `(${c.freq}%)` : ''}
              </span>
            `).join('')}
            ${p.companies.length > 8 ? `
              <span class="mini-comp-badge" style="color: var(--accent);">+${p.companies.length - 8} more</span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Search input listeners
  function setupSearchListeners() {
    companySearchInput.addEventListener('input', (e) => {
      companySearchQuery = e.target.value;
      renderCompaniesList();
    });

    problemSearchInput.addEventListener('input', (e) => {
      problemSearchQuery = e.target.value;
      renderProblemSearchResults();
    });
  }

  // Settings synchronization
  function setupSettings() {
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['showProblemTags', 'showProblemsetFilter', 'defaultTimeframe'], (res) => {
        if (res) {
          if (res.showProblemTags !== undefined) settingShowTags.checked = res.showProblemTags;
          if (res.showProblemsetFilter !== undefined) settingShowFilter.checked = res.showProblemsetFilter;
          if (res.defaultTimeframe) settingDefaultTf.value = res.defaultTimeframe;
        }
      });

      settingShowTags.addEventListener('change', () => {
        chrome.storage.sync.set({ showProblemTags: settingShowTags.checked });
      });

      settingShowFilter.addEventListener('change', () => {
        chrome.storage.sync.set({ showProblemsetFilter: settingShowFilter.checked });
      });

      settingDefaultTf.addEventListener('change', () => {
        chrome.storage.sync.set({ defaultTimeframe: settingDefaultTf.value });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
