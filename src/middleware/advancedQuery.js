const { Op } = require('sequelize');
const { logger } = require('./logger');

/**
 * Advanced query middleware for search, filter, sort, and pagination
 *
 * Query parameters:
 * - search: General search term
 * - filter[field]: Filter by field value
 * - sort: Field to sort by (prefix with - for descending)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - fields: Comma-separated list of fields to include
 */
class AdvancedQuery {
  constructor(model, options = {}) {
    this.model = model;
    this.options = {
      searchFields: options.searchFields || [],
      filterableFields: options.filterableFields || [],
      sortableFields: options.sortableFields || [],
      defaultSort: options.defaultSort || 'createdAt',
      defaultLimit: options.defaultLimit || 10,
      maxLimit: options.maxLimit || 100,
      associations: options.associations || []
    };
  }

  /**
   * Build query from request
   */
  async execute(req) {
    try {
      const query = {
        where: {},
        order: [],
        limit: this.options.defaultLimit,
        offset: 0,
        include: this.options.associations
      };

      // Search
      if (req.query.search && this.options.searchFields.length > 0) {
        query.where[Op.or] = this.options.searchFields.map(field => ({
          [field]: {
            [Op.iLike]: `%${req.query.search}%`
          }
        }));
      }

      // Filters
      if (req.query.filter) {
        const filters = typeof req.query.filter === 'string'
          ? JSON.parse(req.query.filter)
          : req.query.filter;

        Object.keys(filters).forEach(key => {
          if (this.options.filterableFields.includes(key)) {
            query.where[key] = this.parseFilterValue(filters[key]);
          }
        });
      }

      // Individual filter parameters (filter[field]=value)
      Object.keys(req.query).forEach(key => {
        if (key.startsWith('filter[') && key.endsWith(']')) {
          const field = key.slice(7, -1);
          if (this.options.filterableFields.includes(field)) {
            query.where[field] = this.parseFilterValue(req.query[key]);
          }
        }
      });

      // Sorting
      if (req.query.sort) {
        const sortFields = req.query.sort.split(',');
        sortFields.forEach(field => {
          const isDescending = field.startsWith('-');
          const fieldName = isDescending ? field.slice(1) : field;

          if (this.options.sortableFields.includes(fieldName)) {
            query.order.push([fieldName, isDescending ? 'DESC' : 'ASC']);
          }
        });
      } else {
        // Default sort
        const isDescending = this.options.defaultSort.startsWith('-');
        const fieldName = isDescending ? this.options.defaultSort.slice(1) : this.options.defaultSort;
        query.order.push([fieldName, isDescending ? 'DESC' : 'ASC']);
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(
        parseInt(req.query.limit) || this.options.defaultLimit,
        this.options.maxLimit
      );

      query.limit = limit;
      query.offset = (page - 1) * limit;

      // Field selection
      if (req.query.fields) {
        query.attributes = req.query.fields.split(',');
      }

      // Date range filters
      if (req.query.startDate || req.query.endDate) {
        const dateField = req.query.dateField || 'createdAt';
        query.where[dateField] = {};

        if (req.query.startDate) {
          query.where[dateField][Op.gte] = new Date(req.query.startDate);
        }

        if (req.query.endDate) {
          query.where[dateField][Op.lte] = new Date(req.query.endDate);
        }
      }

      // Execute query
      const result = await this.model.findAndCountAll(query);

      // Build pagination metadata
      const totalPages = Math.ceil(result.count / limit);
      const pagination = {
        total: result.count,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return {
        success: true,
        data: result.rows,
        pagination,
        query: {
          search: req.query.search,
          filter: req.query.filter,
          sort: req.query.sort,
          fields: req.query.fields
        }
      };
    } catch (error) {
      logger.error('Advanced query error:', error);
      throw error;
    }
  }

  /**
   * Parse filter value to handle operators
   */
  parseFilterValue(value) {
    // Handle JSON stringified values
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Not JSON, use as is
      }
    }

    // Handle operators
    if (typeof value === 'object' && value !== null) {
      const result = {};

      Object.keys(value).forEach(key => {
        switch (key) {
          case '$gt':
            result[Op.gt] = value[key];
            break;
          case '$gte':
            result[Op.gte] = value[key];
            break;
          case '$lt':
            result[Op.lt] = value[key];
            break;
          case '$lte':
            result[Op.lte] = value[key];
            break;
          case '$ne':
            result[Op.ne] = value[key];
            break;
          case '$in':
            result[Op.in] = Array.isArray(value[key]) ? value[key] : [value[key]];
            break;
          case '$nin':
            result[Op.notIn] = Array.isArray(value[key]) ? value[key] : [value[key]];
            break;
          case '$like':
            result[Op.like] = `%${value[key]}%`;
            break;
          case '$ilike':
            result[Op.iLike] = `%${value[key]}%`;
            break;
          case '$between':
            result[Op.between] = value[key];
            break;
          default:
            result[key] = value[key];
        }
      });

      return Object.keys(result).length > 0 ? result : value;
    }

    return value;
  }
}

/**
 * Middleware factory
 */
const advancedQuery = (model, options = {}) => {
  const queryBuilder = new AdvancedQuery(model, options);

  return async (req, res, next) => {
    try {
      const result = await queryBuilder.execute(req);

      // Attach result to request
      req.queryResult = result;

      next();
    } catch (error) {
      logger.error('Advanced query middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Query execution failed',
        error: error.message
      });
    }
  };
};

/**
 * Helper to build filter from request
 */
const buildFilter = (req, allowedFields = []) => {
  const filter = {};

  Object.keys(req.query).forEach(key => {
    if (allowedFields.includes(key) && req.query[key]) {
      filter[key] = req.query[key];
    }
  });

  return filter;
};

/**
 * Helper to build search query
 */
const buildSearch = (searchTerm, searchFields = []) => {
  if (!searchTerm || searchFields.length === 0) {
    return {};
  }

  return {
    [Op.or]: searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`
      }
    }))
  };
};

/**
 * Helper to build date range filter
 */
const buildDateRange = (startDate, endDate, field = 'createdAt') => {
  const filter = {};

  if (startDate || endDate) {
    filter[field] = {};

    if (startDate) {
      filter[field][Op.gte] = new Date(startDate);
    }

    if (endDate) {
      filter[field][Op.lte] = new Date(endDate);
    }
  }

  return filter;
};

module.exports = {
  AdvancedQuery,
  advancedQuery,
  buildFilter,
  buildSearch,
  buildDateRange
};
