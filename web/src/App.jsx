import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Search,
  Clock,
  Flame,
  ExternalLink,
  CheckCircle2,
  Circle,
  Moon,
  Sun,
  Filter,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Download,
  Share2,
  Terminal,
  Puzzle,
  Copy,
  Check,
  Zap,
  Tag,
  Globe,
  ArrowRight,
  BarChart2,
  Package,
  Chrome,
  Star,
} from 'lucide-react';

const EDGE_STORE_URL =
  'https://microsoftedge.microsoft.com/addons/detail/leetcode-company-tags-f/doaaobpiiccnfcepjjkbogeacmmcpneb';

const POPULAR_COMPANIES = [
  { slug: 'google', name: 'Google' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'meta', name: 'Meta' },
  { slug: 'microsoft', name: 'Microsoft' },
  { slug: 'bloomberg', name: 'Bloomberg' },
  { slug: 'apple', name: 'Apple' },
  { slug: 'uber', name: 'Uber' },
  { slug: 'tiktok', name: 'TikTok' },
  { slug: 'netflix', name: 'Netflix' },
  { slug: 'stripe', name: 'Stripe' },
  { slug: 'goldman-sachs', name: 'Goldman Sachs' },
];

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemLabel = 'items',
  standalone = false,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className={`pagination-bar ${standalone ? 'standalone' : ''}`}>
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
        </span>
        {onPageSizeChange && (
          <div className="pagination-page-size-wrap">
            <span className="pagination-label">Per page:</span>
            <div className="btn-segment-group">
              {pageSizeOptions.map(size => (
                <button
                  key={size}
                  className={`btn-segment ${pageSize === size ? 'active' : ''}`}
                  onClick={() => onPageSizeChange(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn icon-only"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            title="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            className="pagination-btn icon-only"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="pagination-pages-list">
            {pages.map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className="pagination-ellipsis">
                  •••
                </span>
              ) : (
                <button
                  key={p}
                  className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-btn icon-only"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            className="pagination-btn icon-only"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // ── Datasets ───────────────────────────────────────────────────────────────
  const [companiesMeta, setCompaniesMeta] = useState([]);
  const [companyToProblems, setCompanyToProblems] = useState({});
  const [problemToCompanies, setProblemToCompanies] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('company-explorer');

  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [companyInput, setCompanyInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [timeframe, setTimeframe] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [problemSearch, setProblemSearch] = useState('');

  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState('freq');
  const [sortOrder, setSortOrder] = useState('desc');

  // ── Solved (persisted) ────────────────────────────────────────────────────
  const [solvedMap, setSolvedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('solved_problems') || '{}');
    } catch {
      return {};
    }
  });

  // ── Reverse lookup ────────────────────────────────────────────────────────
  const [reverseSearchQuery, setReverseSearchQuery] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');

  // ── Pagination states ─────────────────────────────────────────────────────
  // 1. Company Explorer problems table
  const [problemsPage, setProblemsPage] = useState(1);
  const [problemsPageSize, setProblemsPageSize] = useState(25);
  const tableCardRef = useRef(null);

  // 2. Problem reverse lookup
  const [lookupPage, setLookupPage] = useState(1);
  const [lookupPageSize, setLookupPageSize] = useState(15);

  // 3. All Companies directory
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryPageSize, setDirectoryPageSize] = useState(48);

  // Reset problems table page when filters or page size change
  useEffect(() => {
    setProblemsPage(1);
  }, [selectedCompany, timeframe, difficulty, problemSearch, problemsPageSize]);

  // Reset reverse lookup page when query or page size change
  useEffect(() => {
    setLookupPage(1);
  }, [reverseSearchQuery, lookupPageSize]);

  // Reset directory page when search or page size change
  useEffect(() => {
    setDirectoryPage(1);
  }, [directorySearch, directoryPageSize]);

  const handleProblemsPageChange = newPage => {
    setProblemsPage(newPage);
    if (tableCardRef.current) {
      const top = tableCardRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // ── Sync theme ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [metaRes, c2pRes, p2cRes] = await Promise.all([
          fetch('/data/companies_meta.json').then(r => r.json()),
          fetch('/data/company_to_problems.json').then(r => r.json()),
          fetch('/data/problem_to_companies.json').then(r => r.json()),
        ]);
        setCompaniesMeta(metaRes);
        setCompanyToProblems(c2pRes);
        setProblemToCompanies(p2cRes);

        const params = new URLSearchParams(window.location.search);
        const compParam = params.get('company');
        const tfParam = params.get('timeframe');
        const probParam = params.get('problem');

        if (compParam && c2pRes[compParam]) setSelectedCompany(compParam);
        if (tfParam) setTimeframe(tfParam);
        if (probParam) {
          setActiveTab('problem-lookup');
          setReverseSearchQuery(probParam);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Sync URL & title ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const params = new URLSearchParams();
    if (selectedCompany) params.set('company', selectedCompany);
    if (timeframe !== 'all') params.set('timeframe', timeframe);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);

    const cData = companyToProblems[selectedCompany];
    if (cData) {
      document.title = `${cData.name} Interview Questions (${cData.total} Problems) | LeetCode Company Explorer`;
    }
  }, [selectedCompany, timeframe, isLoading, companyToProblems]);

  // ── Toggle solved ─────────────────────────────────────────────────────────
  const toggleSolved = slug => {
    setSolvedMap(prev => {
      const updated = { ...prev, [slug]: !prev[slug] };
      localStorage.setItem('solved_problems', JSON.stringify(updated));
      return updated;
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const currentCompanyData = useMemo(
    () => companyToProblems[selectedCompany] || null,
    [companyToProblems, selectedCompany]
  );

  const matchingCompanies = useMemo(() => {
    if (!companyInput.trim()) return [];
    const q = companyInput.toLowerCase().trim();
    return companiesMeta
      .filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q))
      .slice(0, 8);
  }, [companiesMeta, companyInput]);

  const filteredProblems = useMemo(() => {
    if (!currentCompanyData || !currentCompanyData.problems) return [];

    let list = currentCompanyData.problems.filter(p => {
      if (timeframe !== 'all') {
        if (!p.timeframes || !p.timeframes.includes(timeframe)) return false;
      }
      if (difficulty !== 'all') {
        if ((p.difficulty || '').toLowerCase() !== difficulty.toLowerCase()) return false;
      }
      if (problemSearch.trim()) {
        const q = problemSearch.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const idMatch = p.id && String(p.id) === q.replace('#', '');
        const slugMatch = (p.slug || '').includes(q);
        if (!titleMatch && !idMatch && !slugMatch) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;

      if (sortBy === 'diff') {
        const order = { Easy: 1, Medium: 2, Hard: 3 };
        valA = order[a.difficulty] || 0;
        valB = order[b.difficulty] || 0;
      } else if (sortBy === 'acc') {
        valA = parseFloat(a.acceptance) || 0;
        valB = parseFloat(b.acceptance) || 0;
      }

      if (sortOrder === 'desc') return valB > valA ? 1 : valB < valA ? -1 : 0;
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    return list;
  }, [currentCompanyData, timeframe, difficulty, problemSearch, sortBy, sortOrder]);

  const paginatedProblems = useMemo(() => {
    const start = (problemsPage - 1) * problemsPageSize;
    return filteredProblems.slice(start, start + problemsPageSize);
  }, [filteredProblems, problemsPage, problemsPageSize]);

  const reverseLookupResults = useMemo(() => {
    if (!reverseSearchQuery.trim() || !problemToCompanies) return [];
    const q = reverseSearchQuery.toLowerCase().trim();
    const results = [];

    for (const [slug, data] of Object.entries(problemToCompanies)) {
      const titleMatch = (data.title || '').toLowerCase().includes(q);
      const idMatch = data.id && String(data.id) === q.replace('#', '');
      const slugMatch = slug.includes(q);
      if (titleMatch || idMatch || slugMatch) results.push(data);
    }

    return results;
  }, [problemToCompanies, reverseSearchQuery]);

  const paginatedLookupResults = useMemo(() => {
    const start = (lookupPage - 1) * lookupPageSize;
    return reverseLookupResults.slice(start, start + lookupPageSize);
  }, [reverseLookupResults, lookupPage, lookupPageSize]);

  const filteredCompaniesMeta = useMemo(() => {
    if (!directorySearch.trim()) return companiesMeta;
    const q = directorySearch.toLowerCase().trim();
    return companiesMeta.filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q));
  }, [companiesMeta, directorySearch]);

  const paginatedCompanies = useMemo(() => {
    const start = (directoryPage - 1) * directoryPageSize;
    return filteredCompaniesMeta.slice(start, start + directoryPageSize);
  }, [filteredCompaniesMeta, directoryPage, directoryPageSize]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleSortToggle = col => {
    if (sortBy === col) setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortOrder('desc'); }
  };

  const getDiffCounts = problems => {
    let easy = 0, med = 0, hard = 0;
    (problems || []).forEach(p => {
      const d = (p.difficulty || '').toLowerCase();
      if (d === 'easy') easy++;
      else if (d === 'medium') med++;
      else if (d === 'hard') hard++;
    });
    return { easy, med, hard };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="app-container">

      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-inner">
          <a href="/" className="brand-group">
            <span className="brand-icon-wrap">
              <Building2 size={18} />
            </span>
            <div className="brand-title">
              LeetCode Company Tags
              <span className="brand-badge">2026</span>
            </div>
          </a>

          <div className="nav-actions">
            <a
              href={EDGE_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="nav-btn-cta"
            >
              <Package size={14} />
              <span>Install Extension</span>
            </a>

            <button
              className="nav-btn"
              onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <a
              href="https://github.com/snehasishroy/leetcode-companywise-interview-questions"
              target="_blank"
              rel="noreferrer"
              className="nav-btn"
            >
              <span>GitHub Dataset</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">

        {/* ── Hero Section ── */}
        <section className="hero-section">
          <div className="hero-inner">

            <div className="hero-eyebrow">
              <Zap size={12} />
              Free browser extension for Chrome, Edge &amp; Brave
            </div>

            <h1 className="hero-title">
              Know exactly which companies<br />
              asked every <span className="accent-word">LeetCode problem</span>
            </h1>

            <p className="hero-subtitle">
              Company tags, interview frequency &amp; recency data for 3,399 problems across
              660+ companies — injected directly on LeetCode pages.
            </p>

            <div className="hero-ctas">
              <a
                href={EDGE_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <Package size={16} />
                Install for Edge
              </a>
              <button
                className="btn-secondary"
                onClick={() => setActiveTab('company-explorer')}
              >
                <BarChart2 size={16} />
                Open Explorer
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Bento stat strip */}
            <div className="hero-bento">
              <div className="bento-card">
                <Building2 size={18} className="bento-icon" style={{ color: 'var(--accent)' }} />
                <div className="bento-value">660+</div>
                <div className="bento-label">Companies tracked</div>
              </div>
              <div className="bento-card">
                <Tag size={18} className="bento-icon" style={{ color: 'var(--easy)' }} />
                <div className="bento-value">3,399</div>
                <div className="bento-label">Tagged problems</div>
              </div>
              <div className="bento-card">
                <Clock size={18} className="bento-icon" style={{ color: 'var(--medium)' }} />
                <div className="bento-value">30d / 3mo / 6mo</div>
                <div className="bento-label">Recency filters</div>
              </div>
              <div className="bento-card">
                <CheckCircle2 size={18} className="bento-icon" style={{ color: 'var(--hard)' }} />
                <div className="bento-value">Solved tracker</div>
                <div className="bento-label">Persisted locally</div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Tab Navigation ── */}
        <div className="tab-navigation-wrap">
          <div className="tab-navigation">
            <button
              className={`tab-nav-btn ${activeTab === 'company-explorer' ? 'active' : ''}`}
              onClick={() => setActiveTab('company-explorer')}
            >
              <Building2 size={15} />
              <span>Company Explorer</span>
            </button>

            <button
              className={`tab-nav-btn ${activeTab === 'problem-lookup' ? 'active' : ''}`}
              onClick={() => setActiveTab('problem-lookup')}
            >
              <Search size={15} />
              <span>Problem Lookup</span>
            </button>

            <button
              className={`tab-nav-btn ${activeTab === 'all-companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('all-companies')}
            >
              <Layers size={15} />
              <span>All Companies</span>
            </button>

            <button
              className={`tab-nav-btn ${activeTab === 'install-guide' ? 'active' : ''}`}
              onClick={() => setActiveTab('install-guide')}
            >
              <BookOpen size={15} />
              <span>Install Guide</span>
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        {isLoading ? (
          <div className="loading-state">
            <Sparkles
              size={30}
              style={{ animation: 'spin 2s linear infinite', color: 'var(--accent)' }}
            />
            <p>Loading LeetCode Company Database (3,399 problems &amp; 660 companies)...</p>
          </div>

        ) : activeTab === 'company-explorer' ? (
          /* ── Tab 1: Company Explorer ── */
          <>
            {/* Filter Panel */}
            <div className="filter-panel">
              {/* Company search + popular chips */}
              <div className="filter-row-top">
                <div className="company-select-wrap">
                  <div className="input-with-icon">
                    <Search className="input-icon" size={16} />
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Search company (e.g. Google, Meta, Bloomberg, Stripe)..."
                      value={companyInput}
                      onChange={e => { setCompanyInput(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>

                  {isDropdownOpen && matchingCompanies.length > 0 && (
                    <div className="company-dropdown-menu">
                      {matchingCompanies.map(c => (
                        <div
                          key={c.slug}
                          className={`dropdown-item ${selectedCompany === c.slug ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCompany(c.slug);
                            setCompanyInput('');
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span className="dropdown-meta">
                            {c.total} Qs &nbsp;({c.easy}E / {c.medium}M / {c.hard}H)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular chips */}
                <div className="popular-chips-wrap">
                  <span className="chips-label">Popular:</span>
                  {POPULAR_COMPANIES.map(comp => (
                    <button
                      key={comp.slug}
                      className={`popular-chip ${selectedCompany === comp.slug ? 'active' : ''}`}
                      onClick={() => { setSelectedCompany(comp.slug); setIsDropdownOpen(false); }}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-filters: timeframe + difficulty + problem search */}
              <div className="sub-filters-row">
                {/* Timeframe */}
                <div className="filter-group">
                  <span className="filter-group-label">
                    <Clock size={13} />
                    Duration
                  </span>
                  <div className="btn-segment-group">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: '30d',  label: '30 Days'  },
                      { key: '3m',   label: '3 Months' },
                      { key: '6m',   label: '6 Months' },
                      { key: '>6m',  label: '> 6 Mos'  },
                    ].map(tf => (
                      <button
                        key={tf.key}
                        className={`btn-segment ${timeframe === tf.key ? 'active' : ''}`}
                        onClick={() => setTimeframe(tf.key)}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="filter-group">
                  <span className="filter-group-label">
                    <BarChart2 size={13} />
                    Difficulty
                  </span>
                  <div className="btn-segment-group">
                    {['all', 'Easy', 'Medium', 'Hard'].map(d => (
                      <button
                        key={d}
                        className={`btn-segment ${d.toLowerCase()} ${difficulty === d ? 'active' : ''}`}
                        onClick={() => setDifficulty(d)}
                      >
                        {d === 'all' ? 'All' : d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem search */}
                <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
                  <div className="input-with-icon" style={{ width: '100%' }}>
                    <Search className="input-icon" size={14} />
                    <input
                      type="text"
                      className="custom-input"
                      style={{ padding: '7px 12px 7px 38px', fontSize: '12.5px' }}
                      placeholder="Filter by title or #ID..."
                      value={problemSearch}
                      onChange={e => setProblemSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Stats Card */}
            {currentCompanyData && (() => {
              const { easy, med, hard } = getDiffCounts(currentCompanyData.problems);
              const total = currentCompanyData.total || 1;
              const ePct = ((easy / total) * 100).toFixed(0);
              const mPct = ((med  / total) * 100).toFixed(0);
              const hPct = ((hard / total) * 100).toFixed(0);

              return (
                <div className="company-stats-card">
                  <div className="stats-company-info">
                    <div className="stats-company-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h2 className="stats-company-title">
                        {currentCompanyData.name} Interview Questions
                      </h2>
                      <div className="stats-company-subtitle">
                        <span>{currentCompanyData.total} total</span>
                        <span className="stats-divider">•</span>
                        <span>{filteredProblems.length} matching filters</span>
                      </div>
                    </div>
                  </div>

                  <div className="difficulty-breakdown-bar">
                    <div className="diff-bar-track">
                      <div className="diff-bar-fill-easy" style={{ width: `${ePct}%` }} />
                      <div className="diff-bar-fill-med"  style={{ width: `${mPct}%` }} />
                      <div className="diff-bar-fill-hard" style={{ width: `${hPct}%` }} />
                    </div>
                    <div className="diff-bar-labels">
                      <span style={{ color: 'var(--easy)'   }}>{easy} Easy ({ePct}%)</span>
                      <span style={{ color: 'var(--medium)' }}>{med} Med ({mPct}%)</span>
                      <span style={{ color: 'var(--hard)'   }}>{hard} Hard ({hPct}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Problems Table */}
            <div className="table-card" ref={tableCardRef}>
              <div className="table-wrapper">
                <table className="problems-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44px' }}>Done</th>
                      <th
                        style={{ width: '56px' }}
                        onClick={() => handleSortToggle('id')}
                        title="Sort by ID"
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          # <ArrowUpDown size={11} />
                        </span>
                      </th>
                      <th onClick={() => handleSortToggle('title')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Problem Title <ArrowUpDown size={11} />
                        </span>
                      </th>
                      <th style={{ width: '110px' }} onClick={() => handleSortToggle('diff')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Difficulty <ArrowUpDown size={11} />
                        </span>
                      </th>
                      <th style={{ width: '110px' }} onClick={() => handleSortToggle('acc')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Acceptance <ArrowUpDown size={11} />
                        </span>
                      </th>
                      <th style={{ width: '130px' }} onClick={() => handleSortToggle('freq')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Frequency <ArrowUpDown size={11} />
                        </span>
                      </th>
                      <th style={{ width: '160px' }}>Recency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProblems.length > 0 ? (
                      paginatedProblems.map(p => {
                        const isSolved   = !!solvedMap[p.slug];
                        const dClass     = (p.difficulty || 'Medium').toLowerCase();
                        const isHighFreq = p.freq >= 75;
                        const isMedFreq  = p.freq >= 35 && p.freq < 75;

                        return (
                          <tr key={p.slug} style={{ opacity: isSolved ? 0.55 : 1 }}>
                            <td>
                              <input
                                type="checkbox"
                                className="solved-checkbox"
                                checked={isSolved}
                                onChange={() => toggleSolved(p.slug)}
                                title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                              />
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                              {p.id || '-'}
                            </td>
                            <td>
                              <a
                                href={`https://leetcode.com/problems/${p.slug}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="prob-title-link"
                              >
                                <span>{p.title}</span>
                                <ExternalLink size={11} style={{ opacity: 0.45 }} />
                              </a>
                            </td>
                            <td>
                              <span className={`diff-badge ${dClass}`}>{p.difficulty}</span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                              {p.acceptance || '-'}
                            </td>
                            <td>
                              <span className={`freq-pill ${isHighFreq ? 'high' : isMedFreq ? 'med' : 'low'}`}>
                                {isHighFreq && <Flame size={11} />}
                                <span>{p.freq ? `${p.freq}%` : 'N/A'}</span>
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {(p.timeframes || []).map(tf => (
                                  <span key={tf} className="timeframe-pill">{tf}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="empty-table-state">
                          <Filter size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                          <p>No questions match your filter criteria.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredProblems.length > 0 && (
                <Pagination
                  currentPage={problemsPage}
                  totalItems={filteredProblems.length}
                  pageSize={problemsPageSize}
                  onPageChange={handleProblemsPageChange}
                  onPageSizeChange={setProblemsPageSize}
                  pageSizeOptions={[25, 50, 100]}
                  itemLabel="questions"
                />
              )}
            </div>
          </>

        ) : activeTab === 'problem-lookup' ? (
          /* ── Tab 2: Reverse Lookup ── */
          <div>
            <div className="filter-panel" style={{ marginBottom: '24px' }}>
              <div className="input-with-icon">
                <Search className="input-icon" size={18} />
                <input
                  type="text"
                  className="custom-input"
                  style={{ padding: '13px 16px 13px 46px', fontSize: '15px' }}
                  placeholder="Search any problem by name (e.g. 'Two Sum', 'LRU Cache') or ID (#146)..."
                  value={reverseSearchQuery}
                  onChange={e => setReverseSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {reverseLookupResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {paginatedLookupResults.map(p => {
                  const dClass = (p.difficulty || 'Medium').toLowerCase();
                  return (
                    <div key={p.slug} className="lookup-result-card">
                      <div className="lookup-problem-header">
                        <div className="lookup-problem-left">
                          <span className="lookup-problem-id">
                            {p.id ? `#${p.id}` : ''}
                          </span>
                          <a
                            href={`https://leetcode.com/problems/${p.slug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="prob-title-link"
                            style={{ fontSize: '15px', fontWeight: 700 }}
                          >
                            <span>{p.title}</span>
                            <ExternalLink size={13} />
                          </a>
                          <span className={`diff-badge ${dClass}`}>{p.difficulty}</span>
                        </div>
                        <span className="lookup-company-count">
                          Asked in {p.companiesCount || p.companies.length} companies
                        </span>
                      </div>

                      <div className="lookup-companies-wrap">
                        {p.companies.map(c => (
                          <div
                            key={c.slug}
                            className="popular-chip"
                            onClick={() => { setSelectedCompany(c.slug); setActiveTab('company-explorer'); }}
                            title="View all questions for this company"
                            style={{ cursor: 'pointer' }}
                          >
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                            {c.freq > 0 && (
                              <span
                                className={`freq-pill ${c.freq >= 75 ? 'high' : c.freq >= 35 ? 'med' : 'low'}`}
                                style={{ padding: '1px 5px', fontSize: '10px' }}
                              >
                                {c.freq}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <Pagination
                  currentPage={lookupPage}
                  totalItems={reverseLookupResults.length}
                  pageSize={lookupPageSize}
                  onPageChange={setLookupPage}
                  onPageSizeChange={setLookupPageSize}
                  pageSizeOptions={[10, 15, 30]}
                  itemLabel="problems"
                  standalone
                />
              </div>
            ) : (
              <div className="empty-table-state" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <Search size={30} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                <p>Type a problem title or number above to see which companies asked it.</p>
              </div>
            )}
          </div>

        ) : activeTab === 'all-companies' ? (
          /* ── Tab 3: All Companies Directory ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div className="section-label">
                {filteredCompaniesMeta.length} {filteredCompaniesMeta.length === 1 ? 'company' : 'companies'} indexed
              </div>
              <div style={{ width: '100%', maxWidth: '340px' }}>
                <div className="input-with-icon">
                  <Search className="input-icon" size={15} />
                  <input
                    type="text"
                    className="custom-input"
                    style={{ padding: '8px 12px 8px 38px', fontSize: '13px' }}
                    placeholder="Search 660+ companies..."
                    value={directorySearch}
                    onChange={e => setDirectorySearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {paginatedCompanies.length > 0 ? (
              <>
                <div className="companies-grid">
                  {paginatedCompanies.map(c => {
                    const total = c.total || 1;
                    const ePct = ((c.easy   / total) * 100).toFixed(0);
                    const mPct = ((c.medium / total) * 100).toFixed(0);
                    const hPct = ((c.hard   / total) * 100).toFixed(0);

                    return (
                      <div
                        key={c.slug}
                        className="company-grid-card"
                        onClick={() => { setSelectedCompany(c.slug); setActiveTab('company-explorer'); }}
                      >
                        <div className="company-card-header">
                          <span className="company-card-name">{c.name}</span>
                          <span className="company-card-count">{c.total} Qs</span>
                        </div>

                        <div className="diff-bar-track">
                          <div className="diff-bar-fill-easy" style={{ width: `${ePct}%` }} />
                          <div className="diff-bar-fill-med"  style={{ width: `${mPct}%` }} />
                          <div className="diff-bar-fill-hard" style={{ width: `${hPct}%` }} />
                        </div>

                        <div className="diff-bar-labels">
                          <span style={{ color: 'var(--easy)'   }}>{c.easy} Easy</span>
                          <span style={{ color: 'var(--medium)' }}>{c.medium} Med</span>
                          <span style={{ color: 'var(--hard)'   }}>{c.hard} Hard</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={directoryPage}
                  totalItems={filteredCompaniesMeta.length}
                  pageSize={directoryPageSize}
                  onPageChange={setDirectoryPage}
                  onPageSizeChange={setDirectoryPageSize}
                  pageSizeOptions={[24, 48, 96]}
                  itemLabel="companies"
                  standalone
                />
              </>
            ) : (
              <div className="empty-table-state" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <Search size={30} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                <p>No companies found matching "{directorySearch}".</p>
              </div>
            )}
          </div>

        ) : (
          /* ── Tab 4: Installation Guide ── */
          <div className="install-guide-wrap">

            {/* What the extension does */}
            <div className="extension-preview-card">
              <div>
                <div className="section-label" style={{ marginBottom: '10px' }}>What it does</div>
                <h2 className="extension-preview-title">
                  Company interview data, right on LeetCode
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '600px', lineHeight: '1.65' }}>
                  The extension reads the LeetCode problem page you have open and injects a panel showing
                  which companies asked that problem in real interviews — with frequency percentages and
                  how recently it appeared (last 30 days, 3 months, or 6 months).
                </p>
              </div>

              <div className="extension-feature-grid">
                <div className="extension-feature-item">
                  <Tag size={16} className="extension-feature-icon" />
                  <span className="extension-feature-text">Company tags injected on every problem page</span>
                </div>
                <div className="extension-feature-item">
                  <TrendingUp size={16} className="extension-feature-icon" />
                  <span className="extension-feature-text">Frequency % shows how often each company asks it</span>
                </div>
                <div className="extension-feature-item">
                  <Clock size={16} className="extension-feature-icon" />
                  <span className="extension-feature-text">30d / 3mo / 6mo recency filters</span>
                </div>
                <div className="extension-feature-item">
                  <Globe size={16} className="extension-feature-icon" />
                  <span className="extension-feature-text">Works on Chrome, Edge, Brave &amp; Arc</span>
                </div>
              </div>
            </div>

            {/* Install from Edge Store CTA */}
            <div className="store-cta-card">
              <div className="store-cta-text">
                <h3>Install from the Edge Add-on Store</h3>
                <p>One-click install. No sign-up. 100% free and open source.</p>
              </div>
              <a
                href={EDGE_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <Package size={16} />
                Install for Edge
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Manual / Developer install */}
            <div>
              <div className="guide-section-title">
                <Puzzle size={18} style={{ color: 'var(--accent)' }} />
                Manual install (Chrome, Brave, Arc)
              </div>
              <div className="guide-steps">
                <div className="guide-step-card">
                  <span className="step-number">1</span>
                  <div className="step-body">
                    <div className="step-title">Clone the repository</div>
                    <div className="step-desc">Download the extension source from GitHub.</div>
                    <div className="code-snippet-row">
                      <code>git clone https://github.com/SITHESWAR-K/leetcode_extension.git</code>
                      <button
                        className="nav-btn"
                        style={{ padding: '3px 9px', flexShrink: 0 }}
                        onClick={() =>
                          copyToClipboard(
                            'git clone https://github.com/SITHESWAR-K/leetcode_extension.git',
                            'clone'
                          )
                        }
                      >
                        {copiedCmd === 'clone'
                          ? <Check size={12} style={{ color: 'var(--easy)' }} />
                          : <Copy size={12} />}
                        <span>{copiedCmd === 'clone' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="guide-step-card">
                  <span className="step-number">2</span>
                  <div className="step-body">
                    <div className="step-title">Open your browser's extension manager</div>
                    <div className="step-desc">
                      Navigate to the extensions page in your browser:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <div className="code-snippet-row" style={{ padding: '8px 12px' }}>
                        <code><strong>Microsoft Edge:</strong> edge://extensions/</code>
                      </div>
                      <div className="code-snippet-row" style={{ padding: '8px 12px' }}>
                        <code><strong>Chrome / Brave / Arc:</strong> chrome://extensions/</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="guide-step-card">
                  <span className="step-number">3</span>
                  <div className="step-body">
                    <div className="step-title">Enable Developer Mode &amp; load unpacked</div>
                    <div className="step-desc">
                      Toggle <strong>Developer Mode</strong> (top-right corner), then click
                      {' '}<strong>"Load unpacked"</strong> and select the root folder of the
                      cloned project. The extension will appear in your toolbar.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Local development */}
            <div>
              <div className="guide-section-title">
                <Terminal size={18} style={{ color: 'var(--easy)' }} />
                Local development
              </div>
              <div className="guide-steps">
                <div className="guide-step-card">
                  <span className="step-number">1</span>
                  <div className="step-body">
                    <div className="step-title">Run the web app locally</div>
                    <pre className="code-block-pre">{`cd web\nnpm install\nnpm run dev`}</pre>
                  </div>
                </div>

                <div className="guide-step-card">
                  <span className="step-number">2</span>
                  <div className="step-body">
                    <div className="step-title">Rebuild all datasets &amp; web app</div>
                    <pre className="code-block-pre">{`npm run build:all`}</pre>
                  </div>
                </div>

                <div className="guide-step-card">
                  <span className="step-number">3</span>
                  <div className="step-body">
                    <div className="step-title">Package extension ZIP for store publishing</div>
                    <pre className="code-block-pre">{`npm run package`}</pre>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          LeetCode Company Tags &amp; Filters &nbsp;•&nbsp; Open Source &amp; Free &nbsp;•&nbsp;
          Data from{' '}
          <a
            href="https://github.com/snehasishroy/leetcode-companywise-interview-questions"
            target="_blank"
            rel="noreferrer"
          >
            snehasishroy/leetcode-companywise-interview-questions
          </a>
        </p>
      </footer>

    </div>
  );
}
