const PaginationControls = ({ pagination, onPageChange, loading }) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, total, hasPrevPage, hasNextPage } = pagination;

  return (
    <div
      style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ color: '#52796f', fontSize: '14px' }}>
        Page {page} of {totalPages} · {total} total items
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || loading}
          style={{
            border: '1px solid #d3e6d9',
            background: 'white',
            color: '#2d6a4f',
            borderRadius: '999px',
            padding: '10px 16px',
            fontWeight: 700,
            cursor: !hasPrevPage || loading ? 'not-allowed' : 'pointer',
            opacity: !hasPrevPage || loading ? 0.5 : 1,
          }}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || loading}
          style={{
            border: 'none',
            background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
            color: 'white',
            borderRadius: '999px',
            padding: '10px 16px',
            fontWeight: 700,
            cursor: !hasNextPage || loading ? 'not-allowed' : 'pointer',
            opacity: !hasNextPage || loading ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
