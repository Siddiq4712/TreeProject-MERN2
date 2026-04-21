const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export const parsePagination = (query = {}, defaults = {}) => {
  const page = Math.max(
    1,
    Number.parseInt(query.page, 10) || defaults.page || DEFAULT_PAGE
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      Number.parseInt(query.limit, 10) || defaults.limit || DEFAULT_LIMIT
    )
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const createPaginatedResponse = ({ items, page, limit, total }) => ({
  items,
  pagination: buildPaginationMeta({ page, limit, total }),
});
