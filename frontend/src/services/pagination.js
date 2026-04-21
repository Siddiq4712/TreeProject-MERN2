export const DEFAULT_PAGE_SIZE = 12;
export const SELECT_PAGE_SIZE = 50;

export const getPaginationParams = (page, limit = DEFAULT_PAGE_SIZE, extraParams = {}) => ({
  page,
  limit,
  ...extraParams,
});

export const normalizePaginatedResponse = (data) => {
  if (data?.items && data?.pagination) {
    return data;
  }

  const items = Array.isArray(data) ? data : [];
  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};
