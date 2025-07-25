import express from 'express';
import Joi from 'joi';
import Ajv from 'ajv';
import { Database } from '../database/index.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();
const ajv = new Ajv();

// Validation schemas
const createSchemaSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  schema: Joi.object().required(),
  tags: Joi.array().items(Joi.string()).default([]),
  is_public: Joi.boolean().default(false),
});

const updateSchemaSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  schema: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  is_public: Joi.boolean().optional(),
});

const searchSchemaSchema = Joi.object({
  q: Joi.string().min(1).required(),
  public: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

// Create a new schema
router.post('/', validateRequest(createSchemaSchema), async (req, res, next) => {
  try {
    const { name, description, schema, tags, is_public } = req.body;
    const userId = req.user!.id;

    // Validate that the provided schema is a valid JSON Schema
    try {
      ajv.compile(schema);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON Schema',
        message: 'The provided schema is not a valid JSON Schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check for duplicate names for this user
    const existingSchema = await Database.getConnection()('schemas')
      .where({ owner_id: userId, name })
      .first();

    if (existingSchema) {
      return res.status(409).json({
        error: 'Schema Already Exists',
        message: `A schema with the name '${name}' already exists`,
      });
    }

    const newSchema = await Database.createSchema({
      name,
      description,
      schema,
      version: 1,
      owner_id: userId,
      organization_id: req.user!.organization_id,
      tags,
      is_public,
      usage_count: 0,
    });

    res.status(201).json({
      message: 'Schema created successfully',
      schema: newSchema,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's schemas
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const schemas = await Database.getSchemasByOwner(userId, limit, offset);

    res.json({
      schemas,
      pagination: {
        limit,
        offset,
        total: schemas.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Search schemas
router.get('/search', validateRequest(searchSchemaSchema, 'query'), async (req, res, next) => {
  try {
    const { q, public: isPublic, limit, offset } = req.query as any;

    const schemas = await Database.searchSchemas(q, isPublic, limit, offset);

    res.json({
      schemas,
      query: q,
      pagination: {
        limit,
        offset,
        total: schemas.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific schema
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const schema = await Database.getSchema(id);

    if (!schema) {
      return res.status(404).json({
        error: 'Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check permissions
    if (schema.owner_id !== userId && !schema.is_public) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to access this schema',
      });
    }

    // Increment usage count if not owner
    if (schema.owner_id !== userId) {
      await Database.incrementSchemaUsage(id);
    }

    res.json({ schema });
  } catch (error) {
    next(error);
  }
});

// Update a schema
router.put('/:id', validateRequest(updateSchemaSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const existingSchema = await Database.getSchema(id);

    if (!existingSchema) {
      return res.status(404).json({
        error: 'Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check ownership
    if (existingSchema.owner_id !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only update your own schemas',
      });
    }

    // Validate JSON Schema if provided
    if (updates.schema) {
      try {
        ajv.compile(updates.schema);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid JSON Schema',
          message: 'The provided schema is not a valid JSON Schema',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const updatedSchema = await Database.updateSchema(id, updates);

    res.json({
      message: 'Schema updated successfully',
      schema: updatedSchema,
    });
  } catch (error) {
    next(error);
  }
});

// Create a new version of a schema
router.post('/:id/versions', validateRequest(createSchemaSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, schema, tags, is_public } = req.body;
    const userId = req.user!.id;

    const parentSchema = await Database.getSchema(id);

    if (!parentSchema) {
      return res.status(404).json({
        error: 'Parent Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check ownership
    if (parentSchema.owner_id !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only create versions of your own schemas',
      });
    }

    // Validate JSON Schema
    try {
      ajv.compile(schema);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON Schema',
        message: 'The provided schema is not a valid JSON Schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const newVersion = await Database.createSchema({
      name: name || parentSchema.name,
      description: description || parentSchema.description,
      schema,
      version: parentSchema.version + 1,
      parent_id: id,
      owner_id: userId,
      organization_id: req.user!.organization_id,
      tags: tags || parentSchema.tags,
      is_public: is_public !== undefined ? is_public : parentSchema.is_public,
      usage_count: 0,
    });

    res.status(201).json({
      message: 'Schema version created successfully',
      schema: newVersion,
    });
  } catch (error) {
    next(error);
  }
});

// Get schema versions
router.get('/:id/versions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const parentSchema = await Database.getSchema(id);

    if (!parentSchema) {
      return res.status(404).json({
        error: 'Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check permissions
    if (parentSchema.owner_id !== userId && !parentSchema.is_public) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to access this schema',
      });
    }

    const versions = await Database.getConnection()('schemas')
      .where({ parent_id: id })
      .orWhere({ id })
      .orderBy('version', 'desc');

    res.json({ versions });
  } catch (error) {
    next(error);
  }
});

// Delete a schema
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const schema = await Database.getSchema(id);

    if (!schema) {
      return res.status(404).json({
        error: 'Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check ownership
    if (schema.owner_id !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only delete your own schemas',
      });
    }

    // Delete all versions of this schema
    await Database.getConnection()('schemas')
      .where({ parent_id: id })
      .orWhere({ id })
      .del();

    res.json({
      message: 'Schema deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Validate JSON against a schema
router.post('/:id/validate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const userId = req.user!.id;

    if (!data) {
      return res.status(400).json({
        error: 'Missing Data',
        message: 'No data provided for validation',
      });
    }

    const schema = await Database.getSchema(id);

    if (!schema) {
      return res.status(404).json({
        error: 'Schema Not Found',
        message: `Schema with ID '${id}' not found`,
      });
    }

    // Check permissions
    if (schema.owner_id !== userId && !schema.is_public) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to use this schema',
      });
    }

    // Perform validation
    const validate = ajv.compile(schema.schema);
    const valid = validate(data);

    if (valid) {
      // Increment usage count
      await Database.incrementSchemaUsage(id);

      res.json({
        valid: true,
        message: 'Data is valid according to the schema',
      });
    } else {
      res.status(400).json({
        valid: false,
        message: 'Data validation failed',
        errors: validate.errors?.map(error => ({
          path: error.instancePath || '/',
          message: error.message || 'Validation error',
          keyword: error.keyword,
          params: error.params,
        })) || [],
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as schemaRoutes };