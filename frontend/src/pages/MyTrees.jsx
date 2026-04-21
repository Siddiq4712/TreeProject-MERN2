import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import PaginationControls from '../components/PaginationControls';
import { DEFAULT_PAGE_SIZE, getPaginationParams, normalizePaginatedResponse } from '../services/pagination';
import { confirmAction, showError, showSuccess } from '../services/dialogs';

const tabs = [
  { key: 'all', label: 'All Trees' },
  { key: 'volunteered', label: 'Volunteered' },
  { key: 'sponsored', label: 'Sponsored' },
  { key: 'planted', label: 'Planted' },
  { key: 'historical', label: 'Historical' },
];

const MyTrees = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trees, setTrees] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const page = Number(searchParams.get('page') || 1);
  const latestRequestRef = useRef(0);

  const getId = (item) => item?._id || item?.id;

  const fetchTrees = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setLoading(true);
    try {
      const res = await api.get('/trees/mine', {
        params: getPaginationParams(page, DEFAULT_PAGE_SIZE, filter === 'all' ? {} : { filter }),
      });
      if (latestRequestRef.current !== requestId) {
        return;
      }
      const normalized = normalizePaginatedResponse(res.data);
      setTrees(normalized.items);
      setPagination(normalized.pagination);
      setSummary(res.data?.summary || null);
    } catch (err) {
      console.error('MyTrees fetchTrees failed:', err);
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [filter, page]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  useEffect(() => {
    const nextFilter = searchParams.get('filter') || 'all';
    if (nextFilter !== filter) {
      setFilter(nextFilter);
    }
  }, [searchParams, filter]);

  const updateQuery = (nextFilter, nextPage = 1) => {
    const nextParams = {};
    if (nextFilter && nextFilter !== 'all') {
      nextParams.filter = nextFilter;
    }
    if (nextPage > 1) {
      nextParams.page = String(nextPage);
    }
    setSearchParams(nextParams);
  };

  const totalTrees = summary?.total ?? pagination?.total ?? 0;
  const healthyTrees = summary?.healthy ?? 0;
  const trackedTrees = summary?.tracked ?? 0;
  const matureTrees = summary?.mature ?? 0;

  const getProgress = (status) => {
    const progress = {
      Planned: 10,
      'Hole-Dug': 28,
      Planted: 50,
      Watered: 66,
      Fertilized: 78,
      Guarded: 88,
      Growing: 92,
      Mature: 100,
      Dead: 0,
    };
    return progress[status] || 0;
  };

  const getStatusTone = (status) => {
    const tones = {
      Planned: '#94a3b8',
      'Hole-Dug': '#f97316',
      Planted: '#22c55e',
      Watered: '#0ea5e9',
      Fertilized: '#8b5cf6',
      Guarded: '#14b8a6',
      Growing: '#166534',
      Mature: '#14532d',
      Dead: '#dc2626',
    };
    return tones[status] || '#64748b';
  };

  const getSurvivalTone = (status) => {
    const tones = {
      Healthy: '#16a34a',
      Weak: '#f59e0b',
      Critical: '#dc2626',
      Dead: '#475569',
    };
    return tones[status] || '#64748b';
  };

  const handleDeleteTree = async (treeId) => {
    const result = await confirmAction(
      'Delete this tree?',
      'This will remove the tree and its tracking history.',
      'Delete tree'
    );
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/trees/${treeId}`);
      setTrees((current) => current.filter((tree) => getId(tree) !== treeId));
      setPagination((current) =>
        current
          ? {
              ...current,
              total: Math.max(0, current.total - 1),
            }
          : current
      );
      setSummary((current) =>
        current
          ? {
              ...current,
              total: Math.max(0, current.total - 1),
              healthy: Math.max(0, current.healthy - 1),
              tracked: Math.max(0, current.tracked - 1),
              mature: current.mature,
            }
          : current
      );
      await showSuccess('Tree deleted');
      fetchTrees();
    } catch (err) {
      showError('Delete failed', err.response?.data?.message || 'Tree could not be deleted.');
    }
  };

  return (
    <div style={{ display: isMobile ? 'block' : 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #f4fbf6 0%, #edf6f0 100%)', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar />

      <main style={{ marginLeft: isMobile ? 0 : isTablet ? '240px' : '280px', width: isMobile ? '100%' : `calc(100% - ${isTablet ? '240px' : '280px'})`, padding: isMobile ? '18px' : '30px 34px 40px' }}>
        <section
          style={{
            borderRadius: '30px',
            padding: isMobile ? '20px' : '32px',
            color: 'white',
            background:
              'radial-gradient(circle at top right, rgba(187,247,208,0.44), transparent 24%), linear-gradient(135deg, #081c15 0%, #1b4332 46%, #2d6a4f 100%)',
            boxShadow: '0 28px 70px rgba(12, 35, 24, 0.14)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '700px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)' }}>
                Tree Tracker
              </div>
              <h1 style={{ margin: '10px 0 0', fontSize: isMobile ? '28px' : '42px', lineHeight: 1.08 }}>Watch each planted tree move from plan to living impact.</h1>
              <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: isMobile ? '14px' : '17px' }}>
                Track sponsorship, planting tasks, survival health, and lifecycle progress from one place.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: '14px', marginTop: '24px' }}>
            {[
              ['Tracked Trees', totalTrees],
              ['Healthy Trees', healthyTrees],
              ['With Activity', trackedTrees],
              ['Mature Trees', matureTrees],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '22px', padding: isMobile ? '14px' : '18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px' }}>{label}</div>
                <div style={{ fontSize: isMobile ? '24px' : '34px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.72)', fontSize: '13px' }}>
            Showing {trees.length} trees on this page · Page {pagination?.page || 1} of {pagination?.totalPages || 1}
          </div>
        </section>

        <section style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                updateQuery(tab.key, 1);
              }}
              style={{
                border: filter === tab.key ? 'none' : '1px solid #d3e6d9',
                background: filter === tab.key ? 'linear-gradient(135deg, #2d6a4f, #1b4332)' : 'white',
                color: filter === tab.key ? 'white' : '#2d6a4f',
                borderRadius: '999px',
                padding: '12px 18px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: filter === tab.key ? '0 12px 30px rgba(15, 47, 36, 0.12)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </section>

        {loading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: '#52796f' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Loading trees...
          </div>
        ) : trees.length === 0 ? (
          <div
            style={{
              marginTop: '22px',
              background: 'white',
              borderRadius: '30px',
              padding: isMobile ? '30px 16px' : '56px 24px',
              textAlign: 'center',
              boxShadow: '0 18px 50px rgba(15, 47, 36, 0.06)',
            }}
          >
            <i className="fas fa-tree" style={{ fontSize: isMobile ? '40px' : '52px', color: '#84cc16', marginBottom: '18px' }}></i>
            <h3 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>No trees found for this view</h3>
            <p style={{ margin: '10px 0 0', color: '#52796f' }}>Try another filter or start recording activity from your plantation flows.</p>
          </div>
        ) : (
          <div style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
            {trees.map((tree) => {
              const progress = getProgress(tree.status);
              const statusTone = getStatusTone(tree.status);
              const survivalTone = getSurvivalTone(tree.survival_status);

              return (
                <article
                  key={getId(tree)}
                  style={{
                    background: 'white',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    border: '1px solid #e8f3eb',
                    boxShadow: '0 24px 60px rgba(15, 47, 36, 0.08)',
                  }}
                >
                  <div
                    style={{
                      padding: isMobile ? '16px' : '22px',
                      background:
                        'radial-gradient(circle at top right, rgba(187,247,208,0.45), transparent 24%), linear-gradient(135deg, #f4fff7 0%, #e6f7eb 100%)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#52796f', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tree.tree_id}</div>
                        <h3 style={{ margin: '8px 0 6px', fontSize: isMobile ? '20px' : '24px', color: '#163126' }}>{tree.species}</h3>
                        <div style={{ color: '#52796f' }}>
                          {tree.land?.name || tree.event?.location || 'Unassigned location'}
                        </div>
                        <div style={{ marginTop: '10px', display: 'inline-flex', gap: '8px', alignItems: 'center', color: '#2d6a4f', fontSize: '12px', fontWeight: 700 }}>
                          <i className="fas fa-seedling"></i>
                          {tree.is_historical ? 'Historical record' : 'Active tracking'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span style={{ background: `${statusTone}18`, color: statusTone, padding: '8px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 }}>
                          {tree.status}
                        </span>
                        <span style={{ background: `${survivalTone}18`, color: survivalTone, padding: '8px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 }}>
                          {tree.survival_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: isMobile ? '16px' : '22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        ['Growth', tree.growth_status],
                        ['Height', `${tree.height_cm || 0} cm`],
                        ['Planter', tree.planter?.name || 'Pending'],
                        ['Sponsor', tree.sponsor?.name || 'Not assigned'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '14px' }}>
                          <div style={{ fontSize: '12px', color: '#52796f' }}>{label}</div>
                          <div style={{ marginTop: '6px', fontWeight: 800, color: '#163126' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#52796f', marginBottom: '8px' }}>
                        <span>Lifecycle progress</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div style={{ height: '10px', background: '#e8f3eb', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4ade80, #166534)' }}></div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 16px',
                        borderRadius: '18px',
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '13px',
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ color: '#163126' }}>{tree.tasks?.length || 0}</strong> recorded activities
                      {tree.last_watered ? ` · Watered ${new Date(tree.last_watered).toLocaleDateString('en-IN')}` : ''}
                    </div>

                    <button
                      onClick={() => navigate(`/tree/${getId(tree)}`)}
                      style={{
                        marginTop: '18px',
                        width: '100%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                        color: 'white',
                        borderRadius: '18px',
                        padding: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 14px 30px rgba(15, 47, 36, 0.14)',
                      }}
                    >
                      Open Tree Detail
                    </button>
                    <button
                      onClick={() => handleDeleteTree(getId(tree))}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        border: '1px solid #fecaca',
                        background: '#fff1f2',
                        color: '#be123c',
                        borderRadius: '18px',
                        padding: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Delete Tree
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <PaginationControls
          pagination={pagination}
          onPageChange={(nextPage) => updateQuery(filter, nextPage)}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default MyTrees;
