import express from 'express';
import Joi from 'joi';
import { Database } from '../database/index.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation schemas
const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).required(),
  template: Joi.string().required(),
  variables: Joi.array().items(Joi.string()).required(),
  category: Joi.string().min(1).max(100).required(),
  is_public: Joi.boolean().default(false),
});

// Get templates
router.get('/', async (req, res, next) => {
  try {
    const isPublic = req.query.public === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const templates = await Database.getTemplates(isPublic, limit, offset);

    res.json({
      templates,
      pagination: {
        limit,
        offset,
        total: templates.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific template
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const template = await Database.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template Not Found',
        message: `Template with ID '${id}' not found`,
      });
    }

    // Check permissions
    if (template.owner_id !== userId && !template.is_public) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to access this template',
      });
    }

    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Create a new template
router.post('/', validateRequest(createTemplateSchema), async (req, res, next) => {
  try {
    const { name, description, template, variables, category, is_public } = req.body;
    const userId = req.user!.id;

    const newTemplate = await Database.createTemplate({
      name,
      description,
      template,
      variables,
      category,
      is_public,
      owner_id: userId,
      organization_id: req.user!.organization_id,
      usage_count: 0,
    });

    res.status(201).json({
      message: 'Template created successfully',
      template: newTemplate,
    });
  } catch (error) {
    next(error);
  }
});

// Use a template (apply variables)
router.post('/:id/use', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;
    const userId = req.user!.id;

    const template = await Database.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template Not Found',
        message: `Template with ID '${id}' not found`,
      });
    }

    // Check permissions
    if (template.owner_id !== userId && !template.is_public) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to use this template',
      });
    }

    // Validate required variables
    const missingVariables = template.variables.filter(
      variable => !variables.hasOwnProperty(variable)
    );

    if (missingVariables.length > 0) {
      return res.status(400).json({
        error: 'Missing Variables',
        message: `Missing required variables: ${missingVariables.join(', ')}`,
        required: template.variables,
        provided: Object.keys(variables),
      });
    }

    // Apply variables to template
    let processedTemplate = template.template;
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      processedTemplate = processedTemplate.replace(
        new RegExp(`{${variable}}`, 'g'),
        value
      );
    });

    // Increment usage count
    await Database.getConnection()('templates')
      .where({ id })
      .increment('usage_count', 1);

    res.json({
      message: 'Template processed successfully',
      result: {
        processedTemplate,
        originalTemplate: template.template,
        variables: variables,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as templatesRoutes };