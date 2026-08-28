import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Download,
  Share2,
  Terminal,
  Puzzle,
  Copy,
  Check
} from 'lucide-react';

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
  { slug: 'goldman-sachs', name: 'Goldman Sachs' }
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Datasets state
  const [companiesMeta, setCompaniesMeta] = useState([]);
  const [companyToProblems, setCompanyToProblems] = useState({});
  const [problemToCompanies, setProblemToCompanies] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('company-explorer'); // 'company-explorer' | 'problem-lookup' | 'all-companies' | 'install-guide'

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [companyInput, setCompanyInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [timeframe, setTimeframe] = useState('all'); // 'all' | '30d' | '3m' | '6m' | '>6m'
  const [difficulty, setDifficulty] = useState('all'); // 'all' | 'Easy' | 'Medium' | 'Hard'
  const [problemSearch, setProblemSearch] = useState('');
  
  // Sort State
  const [sortBy, setSortBy] = useState('freq'); // 'freq' | 'id' | 'diff' | 'acc'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Solved state (persisted)
  const [solvedMap, setSolvedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('solved_problems') || '{}');
    } catch {
      return {};
    }
  });

  // Problem reverse lookup search query
  const [reverseSearchQuery, setReverseSearchQuery] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [metaRes, c2pRes, p2cRes] = await Promise.all([
          fetch('/data/companies_meta.json').then(r => r.json()),
          fetch('/data/company_to_problems.json').then(r => r.json()),
          fetch('/data/problem_to_companies.json').then(r => r.json())
        ]);
        setCompaniesMeta(metaRes);
        setCompanyToProblems(c2pRes);
        setProblemToCompanies(p2cRes);

        // Read URL query params
        const params = new URLSearchParams(window.location.search);
        const compParam = params.get('company');
        const tfParam = params.get('timeframe');
        const probParam = params.get('problem');

        if (compParam && c2pRes[compParam]) {
          setSelectedCompany(compParam);
        }
        if (tfParam) {
          setTimeframe(tfParam);
        }
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

  // Update URL query parameters and dynamic document title on filter change
  useEffect(() => {
    if (isLoading) return;
    const params = new URLSearchParams();
    if (selectedCompany) params.set('company', selectedCompany);
    if (timeframe !== 'all') params.set('timeframe', timeframe);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);

    // Dynamic SEO title
    const cData = companyToProblems[selectedCompany];
    if (cData) {
      document.title = `${cData.name} Interview Questions (${cData.total} Problems) | LeetCode Company Explorer`;
    }
  }, [selectedCompany, timeframe, isLoading, companyToProblems]);

  // Toggle Solved
  const toggleSolved = (slug) => {
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

  // Active Company Data
  const currentCompanyData = useMemo(() => {
    return companyToProblems[selectedCompany] || null;
  }, [companyToProblems, selectedCompany]);

  // Filtered Company List for Autocomplete
  const matchingCompanies = useMemo(() => {
    if (!companyInput.trim()) return [];
    const q = companyInput.toLowerCase().trim();
    return companiesMeta.filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q)).slice(0, 8);
  }, [companiesMeta, companyInput]);

  // Filtered & Sorted Problems for Active Company
  const filteredProblems = useMemo(() => {
    if (!currentCompanyData || !currentCompanyData.problems) return [];

    let list = currentCompanyData.problems.filter(p => {
      // 1. Timeframe Filter
      if (timeframe !== 'all') {
        if (!p.timeframes || !p.timeframes.includes(timeframe)) return false;
      }

      // 2. Difficulty Filter
      if (difficulty !== 'all') {
        if ((p.difficulty || '').toLowerCase() !== difficulty.toLowerCase()) return false;
      }

      // 3. Problem Search Filter
      if (problemSearch.trim()) {
        const q = problemSearch.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const idMatch = p.id && String(p.id) === q.replace('#', '');
        const slugMatch = (p.slug || '').includes(q);
        if (!titleMatch && !idMatch && !slugMatch) return false;
      }

      return true;
    });

    // Sort list
    list.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;

      if (sortBy === 'diff') {
        const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        valA = order[a.difficulty] || 0;
        valB = order[b.difficulty] || 0;
      } else if (sortBy === 'acc') {
        valA = parseFloat(a.acceptance) || 0;
        valB = parseFloat(b.acceptance) || 0;
      }

      if (sortOrder === 'desc') {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      } else {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
    });

    return list;
  }, [currentCompanyData, timeframe, difficulty, problemSearch, sortBy, sortOrder]);

  // Problem Reverse Lookup Matches
  const reverseLookupResults = useMemo(() => {
    if (!reverseSearchQuery.trim() || !problemToCompanies) return [];
    const q = reverseSearchQuery.toLowerCase().trim();
    const results = [];

    for (const [slug, data] of Object.entries(problemToCompanies)) {
      const titleMatch = (data.title || '').toLowerCase().includes(q);
      const idMatch = data.id && String(data.id) === q.replace('#', '');
      const slugMatch = slug.includes(q);

      if (titleMatch || idMatch || slugMatch) {
        results.push(data);
      }
      if (results.length >= 30) break;
    }

    return results;
  }, [problemToCompanies, reverseSearchQuery]);

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <a href="/" className="brand-group">
            <span className="brand-icon">🏢</span>
            <div>
              <div className="brand-title">
                LeetCode Company Explorer
                <span className="brand-badge">2026 Edition</span>
              </div>
            </div>
          </a>

          <div className="nav-actions">
            <button 
              className={`nav-btn ${activeTab === 'install-guide' ? 'primary' : ''}`}
              onClick={() => setActiveTab('install-guide')}
            >
              <Puzzle size={14} />
              <span>Install Extension & Local Setup</span>
            </button>

            <button 
              className="nav-btn" 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <a 
              href="https://github.com/snehasishroy/leetcode-companywise-interview-questions" 
              target="_blank" 
              rel="noreferrer" 
              className="nav-btn"
            >
              <span>GitHub Dataset</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">
            Targeted <span>Company-Wise</span> Interview Preparation
          </h1>
          <p className="hero-subtitle">
            Filter, sort, and track questions asked by <strong>660+ tech companies</strong> with frequency percentages and interview recency (30 days, 3 months, 6 months).
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-nav-btn ${activeTab === 'company-explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('company-explorer')}
          >
            <Building2 size={16} />
            <span>Company Explorer & Filter</span>
          </button>

          <button 
            className={`tab-nav-btn ${activeTab === 'problem-lookup' ? 'active' : ''}`}
            onClick={() => setActiveTab('problem-lookup')}
          >
            <Search size={16} />
            <span>Problem Reverse Lookup</span>
          </button>

          <button 
            className={`tab-nav-btn ${activeTab === 'all-companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-companies')}
          >
            <Layers size={16} />
            <span>All 660+ Companies Directory</span>
          </button>

          <button 
            className={`tab-nav-btn ${activeTab === 'install-guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('install-guide')}
          >
            <BookOpen size={16} />
            <span>Installation & Setup Guide</span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Sparkles size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px' }} />
            <p>Loading LeetCode Company Database (3,399 problems & 660 companies)...</p>
          </div>
        ) : activeTab === 'company-explorer' ? (
          <>
            {/* Filter Control Panel */}
            <div className="filter-panel">
              {/* Top Row: Search Company & Quick Chips */}
              <div className="filter-row-top">
                <div className="company-select-wrap">
                  <div className="input-with-icon">
                    <Search className="input-icon" size={16} />
                    <input 
                      type="text"
                      className="custom-input"
                      placeholder="Search company (e.g. Google, Meta, Bloomberg, Stripe)..."
                      value={companyInput}
                      onChange={(e) => {
                        setCompanyInput(e.target.value);
                        setIsDropdownOpen(true);
                      }}
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
                          <span className="dropdown-meta">{c.total} questions ({c.easy}E / {c.medium}M / {c.hard}H)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular Tech Chips */}
                <div className="popular-chips-wrap">
                  <span className="chips-label">Popular:</span>
                  {POPULAR_COMPANIES.map(comp => (
                    <button
                      key={comp.slug}
                      className={`popular-chip ${selectedCompany === comp.slug ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCompany(comp.slug);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Filters Row: Timeframe, Difficulty, Problem Search */}
              <div className="sub-filters-row">
                {/* Timeframe Filter */}
                <div className="filter-group">
                  <span className="filter-group-label">⏱️ Duration:</span>
                  <div className="btn-segment-group">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: '30d', label: 'Last 30 Days' },
                      { key: '3m', label: '3 Months' },
                      { key: '6m', label: '6 Months' },
                      { key: '>6m', label: '> 6 Mos' }
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

                {/* Difficulty Filter */}
                <div className="filter-group">
                  <span className="filter-group-label">Difficulty:</span>
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

                {/* Problem Name Filter */}
                <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
                  <div className="input-with-icon" style={{ width: '100%' }}>
                    <Search className="input-icon" size={14} />
                    <input 
                      type="text"
                      className="custom-input"
                      style={{ padding: '6px 12px 6px 36px', fontSize: '12px' }}
                      placeholder="Filter by question title or #ID..."
                      value={problemSearch}
                      onChange={(e) => setProblemSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Company Statistics Header */}
            {currentCompanyData && (
              <div className="company-stats-card">
                <div className="stats-company-info">
                  <span className="stats-company-logo">🏢</span>
                  <div>
                    <h2 className="stats-company-title">{currentCompanyData.name} Interview Questions</h2>
                    <div className="stats-company-subtitle">
                      <span>{currentCompanyData.total} Total Questions</span> •
                      <span>Showing {filteredProblems.length} questions matching filters</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty Breakdown Progress Bar */}
                {(() => {
                  let easy = 0, med = 0, hard = 0;
                  currentCompanyData.problems.forEach(p => {
                    const d = (p.difficulty || '').toLowerCase();
                    if (d === 'easy') easy++;
                    else if (d === 'medium') med++;
                    else if (d === 'hard') hard++;
                  });
                  const total = currentCompanyData.total || 1;
                  const ePct = ((easy / total) * 100).toFixed(0);
                  const mPct = ((med / total) * 100).toFixed(0);
                  const hPct = ((hard / total) * 100).toFixed(0);

                  return (
                    <div className="difficulty-breakdown-bar">
                      <div className="diff-bar-track">
                        <div className="diff-bar-fill-easy" style={{ width: `${ePct}%` }} />
                        <div className="diff-bar-fill-med" style={{ width: `${mPct}%` }} />
                        <div className="diff-bar-fill-hard" style={{ width: `${hPct}%` }} />
                      </div>
                      <div className="diff-bar-labels">
                        <span style={{ color: 'var(--easy)' }}>{easy} Easy ({ePct}%)</span>
                        <span style={{ color: 'var(--medium)' }}>{med} Medium ({mPct}%)</span>
                        <span style={{ color: 'var(--hard)' }}>{hard} Hard ({hPct}%)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Problems Table */}
            <div className="table-card">
              <div className="table-wrapper">
                <table className="problems-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>Status</th>
                      <th style={{ width: '60px' }} onClick={() => { setSortBy('id'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>
                        #
                      </th>
                      <th onClick={() => { setSortBy('title'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>
                        Problem Title
                      </th>
                      <th style={{ width: '110px' }} onClick={() => { setSortBy('diff'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>
                        Difficulty
                      </th>
                      <th style={{ width: '110px' }} onClick={() => { setSortBy('acc'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>
                        Acceptance
                      </th>
                      <th style={{ width: '130px' }} onClick={() => { setSortBy('freq'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>
                        Frequency
                      </th>
                      <th style={{ width: '160px' }}>Recency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProblems.length > 0 ? (
                      filteredProblems.map(p => {
                        const isSolved = !!solvedMap[p.slug];
                        const dClass = (p.difficulty || 'Medium').toLowerCase();
                        const isHighFreq = p.freq >= 75;
                        const isMedFreq = p.freq >= 35 && p.freq < 75;

                        return (
                          <tr key={p.slug} style={{ opacity: isSolved ? 0.6 : 1 }}>
                            <td>
                              <input 
                                type="checkbox"
                                className="solved-checkbox"
                                checked={isSolved}
                                onChange={() => toggleSolved(p.slug)}
                                title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                              />
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
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
                                <ExternalLink size={12} style={{ opacity: 0.5 }} />
                              </a>
                            </td>
                            <td>
                              <span className={`diff-badge ${dClass}`}>
                                {p.difficulty}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {p.acceptance || '-'}
                            </td>
                            <td>
                              <span className={`freq-pill ${isHighFreq ? 'high' : isMedFreq ? 'med' : 'low'}`}>
                                {isHighFreq && <Flame size={12} />}
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
                          <p>No questions found matching your filter criteria.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'problem-lookup' ? (
          /* Tab 2: Reverse Lookup (Find Companies by Problem) */
          <div>
            <div className="filter-panel" style={{ marginBottom: '24px' }}>
              <div className="input-with-icon">
                <Search className="input-icon" size={18} />
                <input 
                  type="text"
                  className="custom-input"
                  style={{ padding: '12px 16px 12px 44px', fontSize: '15px' }}
                  placeholder="Search any LeetCode problem by name (e.g. 'Two Sum', 'LRU Cache') or ID (#146)..."
                  value={reverseSearchQuery}
                  onChange={(e) => setReverseSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {reverseLookupResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reverseLookupResults.map(p => {
                  const dClass = (p.difficulty || 'Medium').toLowerCase();
                  return (
                    <div key={p.slug} className="company-stats-card" style={{ display: 'block' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {p.id ? `#${p.id}` : ''}
                          </span>
                          <a 
                            href={`https://leetcode.com/problems/${p.slug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="prob-title-link"
                            style={{ fontSize: '16px', fontWeight: 700 }}
                          >
                            <span>{p.title}</span>
                            <ExternalLink size={14} />
                          </a>
                          <span className={`diff-badge ${dClass}`}>{p.difficulty}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Asked in {p.companiesCount || p.companies.length} Companies
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {p.companies.map(c => (
                          <div 
                            key={c.slug}
                            className="popular-chip"
                            onClick={() => {
                              setSelectedCompany(c.slug);
                              setActiveTab('company-explorer');
                            }}
                            title="View all questions for this company"
                          >
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                            {c.freq > 0 && (
                              <span className={`freq-pill ${c.freq >= 75 ? 'high' : c.freq >= 35 ? 'med' : 'low'}`} style={{ padding: '1px 5px', fontSize: '10px' }}>
                                {c.freq}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-table-state" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Type a problem title or number above to see all companies that ask it in interviews.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'all-companies' ? (
          /* Tab 3: All 660+ Companies Directory */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {companiesMeta.map(c => {
                const total = c.total || 1;
                const ePct = ((c.easy / total) * 100).toFixed(0);
                const mPct = ((c.medium / total) * 100).toFixed(0);
                const hPct = ((c.hard / total) * 100).toFixed(0);

                return (
                  <div 
                    key={c.slug}
                    className="company-stats-card"
                    style={{ margin: 0, cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}
                    onClick={() => {
                      setSelectedCompany(c.slug);
                      setActiveTab('company-explorer');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className="brand-badge">{c.total} Qs</span>
                    </div>

                    <div className="diff-bar-track">
                      <div className="diff-bar-fill-easy" style={{ width: `${ePct}%` }} />
                      <div className="diff-bar-fill-med" style={{ width: `${mPct}%` }} />
                      <div className="diff-bar-fill-hard" style={{ width: `${hPct}%` }} />
                    </div>

                    <div className="diff-bar-labels">
                      <span style={{ color: 'var(--easy)' }}>{c.easy} Easy</span>
                      <span style={{ color: 'var(--medium)' }}>{c.medium} Med</span>
                      <span style={{ color: 'var(--hard)' }}>{c.hard} Hard</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tab 4: Installation & Local Setup Guide */
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Guide Card 1: Browser Extension */}
            <div className="company-stats-card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Puzzle size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800 }}>1. Install Browser Extension (Chrome, Edge, Brave, Arc)</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get company tags and interview frequency badges directly on LeetCode problem pages.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Step 1:</strong> Clone or download the repository from GitHub:
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    <code>git clone https://github.com/YOUR_USERNAME/leetcode_extension.git</code>
                    <button 
                      className="nav-btn" 
                      style={{ padding: '3px 8px' }}
                      onClick={() => copyToClipboard('git clone https://github.com/YOUR_USERNAME/leetcode_extension.git', 'clone')}
                    >
                      {copiedCmd === 'clone' ? <Check size={12} style={{ color: 'var(--easy)' }} /> : <Copy size={12} />}
                      <span>{copiedCmd === 'clone' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Step 2:</strong> Open your browser extension manager:
                  <ul style={{ marginLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>Microsoft Edge:</strong> <code>edge://extensions/</code></li>
                    <li><strong>Google Chrome / Brave / Arc:</strong> <code>chrome://extensions/</code></li>
                  </ul>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Step 3:</strong> Enable <strong>Developer Mode</strong> (top right toggle) and click <strong>"Load unpacked"</strong>. Select the root folder of this project.
                </div>
              </div>
            </div>

            {/* Guide Card 2: Local Development */}
            <div className="company-stats-card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Terminal size={24} style={{ color: 'var(--easy)' }} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800 }}>2. Local Development & Build Commands</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Run the web app locally or update datasets with custom companies.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Run Web App Locally:</strong>
                  <pre style={{ marginTop: '6px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
cd web&#10;npm install&#10;npm run dev
                  </pre>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Rebuild All Datasets & Web App:</strong>
                  <pre style={{ marginTop: '6px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
npm run build:all
                  </pre>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong>Package Extension ZIP for Store Publishing:</strong>
                  <pre style={{ marginTop: '6px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
npm run package
                  </pre>
                </div>
              </div>
            </div>

            
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          LeetCode Company Tags Explorer • Open Source & Free • Data synced from{' '}
          <a href="https://github.com/snehasishroy/leetcode-companywise-interview-questions" target="_blank" rel="noreferrer">
            snehasishroy/leetcode-companywise-interview-questions
          </a>
        </p>
      </footer>
    </div>
  );
}
