/**
 * LeetCode Company Tags Extension
 * Injects sleek, minimal inline company pills directly below problem title & tags.
 */

(function () {
  'use strict';

  // State
  let problemToCompaniesData = null;
  let companiesMetaData = null;
  let isLoadingData = false;
  let isInjecting = false;
  let debounceTimer = null;
  let isExpanded = false;
  let currentProblemSlug = null;

  // Web Dashboard URL (points to your live Firebase deployment)
  const WEB_DASHBOARD_URL = 'https://leetcode-company-viewer.web.app';

  // Fetch Dataset
  async function loadDatasets() {
    if (problemToCompaniesData && companiesMetaData) {
      return { problemToCompaniesData, companiesMetaData };
    }
    if (isLoadingData) {
      while (isLoadingData) {
        await new Promise(r => setTimeout(r, 40));
      }
      return { problemToCompaniesData, companiesMetaData };
    }

    isLoadingData = true;
    try {
      const [p2cRes, metaRes] = await Promise.all([
        fetch(chrome.runtime.getURL('src/data/problem_to_companies.json')).then(r => r.json()),
        fetch(chrome.runtime.getURL('src/data/companies_meta.json')).then(r => r.json())
      ]);

      problemToCompaniesData = p2cRes;
      companiesMetaData = metaRes;
    } catch (err) {
      console.error('❌ Failed to load LeetCode Company dataset:', err);
    } finally {
      isLoadingData = false;
    }

    return { problemToCompaniesData, companiesMetaData };
  }

  function getProblemSlugFromURL() {
    const match = window.location.pathname.match(/\/problems\/([^\/\?#]+)/);
    return match ? match[1].toLowerCase().trim() : null;
  }

  // Find the exact tag row container in LeetCode ([Medium] [Topics] [Companies])
  function findAnchorElement() {
    // 1. Check for difficulty tags: Easy, Medium, Hard
    const diffBadges = document.querySelectorAll(
      'div[class*="text-difficulty"], div[class*="text-olive"], div[class*="text-yellow"], div[class*="text-pink"], div[class*="text-easy"], div[class*="text-medium"], div[class*="text-hard"]'
    );

    for (const badge of diffBadges) {
      const parentRow = badge.closest('div.flex') || badge.parentElement;
      if (parentRow && parentRow.offsetHeight > 0 && !parentRow.closest('#lc-company-pills-row')) {
        return parentRow;
      }
    }

    // 2. Check for question title container
    const titleCandidates = document.querySelectorAll(
      'div[data-cy="question-title"], div[class*="text-title-large"], div[class*="text-lg"], h1, div[data-track-load="description_content"]'
    );

    for (const el of titleCandidates) {
      if (el.offsetHeight > 0 && !el.closest('#lc-company-pills-row')) {
        return el;
      }
    }

    return null;
  }

  // Inject Minimal Inline Pills
  async function injectInlinePills() {
    if (isInjecting) return;
    isInjecting = true;

    try {
      const slug = getProblemSlugFromURL();
      if (!slug) {
        // Not on a problem page, clean up any existing pills
        cleanExistingPills();
        return;
      }

      // Check if already injected for this exact slug and still in DOM
      const existing = document.getElementById('lc-company-pills-row');
      if (existing && existing.dataset.slug === slug && document.body.contains(existing)) {
        return; // Up to date
      }

      await loadDatasets();
      if (!problemToCompaniesData) return;

      const problemData = problemToCompaniesData[slug];
      if (!problemData || !problemData.companies || problemData.companies.length === 0) {
        cleanExistingPills();
        return;
      }

      const anchor = findAnchorElement();
      if (!anchor) return;

      // Clean all existing/duplicate instances before inserting
      cleanExistingPills();

      if (currentProblemSlug !== slug) {
        currentProblemSlug = slug;
        isExpanded = false;
      }

      const pillsRow = document.createElement('div');
      pillsRow.id = 'lc-company-pills-row';
      pillsRow.className = 'lc-company-pills-row';
      pillsRow.dataset.slug = slug;

      renderPillsContent(pillsRow, problemData, slug);

      // Insert immediately after anchor row
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(pillsRow, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(pillsRow);
      }
    } finally {
      isInjecting = false;
    }
  }

  function cleanExistingPills() {
    document.querySelectorAll('#lc-company-pills-row, #lc-company-tags-container, .lc-company-pills-row').forEach(el => {
      el.remove();
    });
  }

  function renderPillsContent(container, problemData, slug) {
    const companies = problemData.companies || [];
    const total = companies.length;
    const limit = isExpanded ? total : 10;
    const visible = companies.slice(0, limit);
    const hasMore = total > 10 && !isExpanded;

    container.innerHTML = `
      <span class="lc-pills-label">🏢 Companies (${total}):</span>
      ${visible.map(c => {
        let freqClass = 'low';
        let freqText = '';
        if (c.freq >= 75) {
          freqClass = 'high';
          freqText = `🔥 ${c.freq}%`;
        } else if (c.freq >= 35) {
          freqClass = 'med';
          freqText = `${c.freq}%`;
        } else if (c.freq > 0) {
          freqClass = 'low';
          freqText = `${c.freq}%`;
        }

        return `
          <a class="lc-company-pill" href="${WEB_DASHBOARD_URL}?company=${encodeURIComponent(c.slug)}" target="_blank" title="View all ${c.name} questions on Web Dashboard">
            <span>${c.name}</span>
            ${freqText ? `<span class="lc-pill-freq ${freqClass}">${freqText}</span>` : ''}
          </a>
        `;
      }).join('')}

      ${hasMore ? `
        <button class="lc-pill-more-btn" id="lc-pills-more-btn">
          +${total - 10} more ▾
        </button>
      ` : ''}

      ${isExpanded && total > 10 ? `
        <button class="lc-pill-more-btn" id="lc-pills-less-btn">
          Show less ▴
        </button>
      ` : ''}

      <a class="lc-pill-dashboard-btn" href="${WEB_DASHBOARD_URL}?problem=${encodeURIComponent(slug)}" target="_blank" title="Open Full Company & Duration Filter Dashboard">
        ↗ Filter Dashboard
      </a>
    `;

    // Toggle expand/collapse
    const moreBtn = container.querySelector('#lc-pills-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = true;
        renderPillsContent(container, problemData, slug);
      });
    }

    const lessBtn = container.querySelector('#lc-pills-less-btn');
    if (lessBtn) {
      lessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = false;
        renderPillsContent(container, problemData, slug);
      });
    }
  }

  // =========================================================================
  // SPA Route & DOM Mutation Handling with Debouncing
  // =========================================================================

  function scheduleInjection() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (window.location.pathname.includes('/problems/')) {
        injectInlinePills();
      } else {
        cleanExistingPills();
      }
    }, 120);
  }

  // Listen to navigation events
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    const ret = originalPushState.apply(this, args);
    scheduleInjection();
    return ret;
  };

  history.replaceState = function (...args) {
    const ret = originalReplaceState.apply(this, args);
    scheduleInjection();
    return ret;
  };

  window.addEventListener('popstate', scheduleInjection);

  // MutationObserver on document.body
  const observer = new MutationObserver(() => {
    scheduleInjection();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInjection);
  } else {
    scheduleInjection();
  }
})();
