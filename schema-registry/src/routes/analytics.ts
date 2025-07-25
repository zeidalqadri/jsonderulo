import express from 'express';
import { Database } from '../database/index.js';

const router = express.Router();

// Get cost analytics
router.get('/costs', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organization_id;
    const hours = parseInt(req.query.hours as string) || 24;

    // Get cost metrics
    const costMetrics = await Database.getCostMetrics(userId, organizationId, hours);
    const totalCost = await Database.getTotalCost(userId, organizationId, hours);

    // Calculate aggregations
    const costByProvider: Record<string, number> = {};
    const costByModel: Record<string, number> = {};
    const costByOperation: Record<string, number> = {};

    costMetrics.forEach(metric => {
      costByProvider[metric.provider] = (costByProvider[metric.provider] || 0) + metric.total_cost;
      costByModel[metric.model] = (costByModel[metric.model] || 0) + metric.total_cost;
      costByOperation[metric.operation_type] = (costByOperation[metric.operation_type] || 0) + metric.total_cost;
    });

    // Calculate averages
    const averageCostPerRequest = costMetrics.length > 0 ? totalCost / costMetrics.length : 0;

    // Generate trend data (daily buckets)
    const costTrend = generateCostTrend(costMetrics);

    // Generate optimization suggestions
    const suggestions = generateOptimizationSuggestions(
      costByProvider,
      costByModel,
      averageCostPerRequest
    );

    res.json({
      summary: {
        totalCost,
        totalRequests: costMetrics.length,
        averageCostPerRequest,
        timeframe: `${hours} hours`,
      },
      breakdown: {
        byProvider: costByProvider,
        byModel: costByModel,
        byOperation: costByOperation,
      },
      trends: {
        costTrend,
      },
      suggestions,
    });
  } catch (error) {
    next(error);
  }
});

// Get usage analytics
router.get('/usage', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organization_id;

    // Get schema usage stats
    let schemaQuery = Database.getConnection()('schemas')
      .select('id', 'name', 'usage_count', 'created_at')
      .orderBy('usage_count', 'desc')
      .limit(10);

    if (organizationId) {
      schemaQuery = schemaQuery.where({ organization_id: organizationId });
    } else {
      schemaQuery = schemaQuery.where({ owner_id: userId });
    }

    const topSchemas = await schemaQuery;

    // Get template usage stats
    let templateQuery = Database.getConnection()('templates')
      .select('id', 'name', 'usage_count', 'category', 'created_at')
      .orderBy('usage_count', 'desc')
      .limit(10);

    if (organizationId) {
      templateQuery = templateQuery.where({ organization_id: organizationId });
    } else {
      templateQuery = templateQuery.where({ owner_id: userId });
    }

    const topTemplates = await templateQuery;

    // Get total counts
    let schemaTotalQuery = Database.getConnection()('schemas');
    let templateTotalQuery = Database.getConnection()('templates');

    if (organizationId) {
      schemaTotalQuery = schemaTotalQuery.where({ organization_id: organizationId });
      templateTotalQuery = templateTotalQuery.where({ organization_id: organizationId });
    } else {
      schemaTotalQuery = schemaTotalQuery.where({ owner_id: userId });
      templateTotalQuery = templateTotalQuery.where({ owner_id: userId });
    }

    const [{ count: totalSchemas }] = await schemaTotalQuery.count('* as count');
    const [{ count: totalTemplates }] = await templateTotalQuery.count('* as count');

    res.json({
      summary: {
        totalSchemas: parseInt(totalSchemas as string),
        totalTemplates: parseInt(totalTemplates as string),
      },
      topSchemas,
      topTemplates,
    });
  } catch (error) {
    next(error);
  }
});

// Record cost metric (for internal use)
router.post('/costs', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organization_id;
    const {
      provider,
      model,
      input_tokens,
      output_tokens,
      total_cost,
      operation_type,
      metadata,
    } = req.body;

    const costMetric = await Database.recordCostMetric({
      user_id: userId,
      organization_id: organizationId,
      provider,
      model,
      input_tokens,
      output_tokens,
      total_cost,
      operation_type,
      metadata,
    });

    res.status(201).json({
      message: 'Cost metric recorded successfully',
      metric: costMetric,
    });
  } catch (error) {
    next(error);
  }
});

function generateCostTrend(costMetrics: any[]): { date: string; cost: number }[] {
  const dailyCosts: Record<string, number> = {};

  costMetrics.forEach(metric => {
    const date = metric.created_at.toISOString().split('T')[0];
    dailyCosts[date] = (dailyCosts[date] || 0) + metric.total_cost;
  });

  return Object.entries(dailyCosts)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateOptimizationSuggestions(
  costByProvider: Record<string, number>,
  costByModel: Record<string, number>,
  averageCost: number
): string[] {
  const suggestions: string[] = [];

  // Provider cost comparison
  const providers = Object.entries(costByProvider).sort((a, b) => b[1] - a[1]);
  if (providers.length > 1) {
    const mostExpensive = providers[0];
    const leastExpensive = providers[providers.length - 1];
    if (mostExpensive[1] > leastExpensive[1] * 2) {
      suggestions.push(
        `Consider using ${leastExpensive[0]} more often - it's significantly cheaper than ${mostExpensive[0]}`
      );
    }
  }

  // Model suggestions
  const expensiveModels = Object.entries(costByModel)
    .filter(([_, cost]) => cost > averageCost * 1.5)
    .map(([model]) => model);

  if (expensiveModels.length > 0) {
    suggestions.push(
      `Consider using smaller models for simple tasks. Models like ${expensiveModels.join(', ')} are driving up costs`
    );
  }

  // Usage pattern suggestions
  if (averageCost > 0.01) {
    suggestions.push('Consider implementing response caching for repeated queries');
  }

  if (suggestions.length === 0) {
    suggestions.push('Your usage patterns look cost-efficient!');
  }

  return suggestions;
}

export { router as analyticsRoutes };