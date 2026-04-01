const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const getPagingData = (count, rows, page, limit) => {
  const totalPages = Math.ceil(count / limit) || 1;

  return {
    meta: {
      total: count,
      page,
      limit,
      totalPages,
    },
    rows,
  };
};

module.exports = {
  getPagination,
  getPagingData,
};
