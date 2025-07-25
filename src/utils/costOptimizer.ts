import { CostMetrics } from '../providers/base.js';

export interface CostOptimizationRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: CostMetrics[]) => boolean;
  recommendation: string;
  potentialSavings: number; // Percentage
}

export interface OptimizationInsight {
  rule: CostOptimizationRule;
  triggered: boolean;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number; // Dollar amount
}

export interface CostForecast {
  daily: number;
  weekly: number;
  monthly: number;
  confidence: number; // 0-1
}

export class CostOptimizer {
  private optimizationRules: CostOptimizationRule[] = [
    {
      id: 'provider_cost_mismatch',
      name: 'Provider Cost Mismatch',
      description: 'Expensive provider being used for simple tasks',
      condition: metrics => {
        const avgCostByProvider = this.getAverageCostByProvider(metrics);
        const providers = Object.keys(avgCostByProvider);
        if (providers.length < 2) return false;

        const costs = Object.values(avgCostByProvider);
        const maxCost = Math.max(...costs);
        const minCost = Math.min(...costs);

        return maxCost > minCost * 3; // 3x cost difference
      },
      recommendation: 'Route simple tasks to cheaper providers automatically',
      potentialSavings: 40,
    },
    {
      id: 'model_overprovisioning',
      name: 'Model Overprovisioning',
      description: 'Using large models for tasks that smaller models can handle',
      condition: metrics => {
        const expensiveModelUsage = metrics.filter(
          m => m.model.includes('gpt-4') || m.model.includes('claude-3-opus')
        ).length;
        return expensiveModelUsage / metrics.length > 0.6; // >60% expensive model usage
      },
      recommendation:
        'Use smaller models (gpt-3.5-turbo, claude-haiku) for simple schema generation',
      potentialSavings: 70,
    },
    {
      id: 'high_token_usage',
      name: 'High Token Usage',
      description: 'Prompts are generating excessive tokens',
      condition: metrics => {
        const avgTokens = metrics.reduce((sum, m) => sum + m.outputTokens, 0) / metrics.length;
        return avgTokens > 2000; // Average >2k output tokens
      },
      recommendation: 'Optimize prompts to be more concise and add max_tokens limits',
      potentialSavings: 30,
    },
    {
      id: 'retry_overhead',
      name: 'Excessive Retry Overhead',
      description: 'High failure rate leading to expensive retries',
      condition: metrics => {
        // This would need to be tracked separately, simplified for demo
        return metrics.length > 100 && this.estimateRetryRate(metrics) > 0.2;
      },
      recommendation: 'improve schema generation accuracy to reduce retry attempts',
      potentialSavings: 25,
    },
    {
      id: 'peak_usage_concentration',
      name: 'Peak Usage Concentration',
      description: 'Usage concentrated during peak pricing hours',
      condition: metrics => {
        const peakHourUsage = metrics.filter(m => {
          const hour = m.timestamp.getHours();
          return hour >= 9 && hour <= 17; // Business hours
        }).length;
        return peakHourUsage / metrics.length > 0.8;
      },
      recommendation: 'Consider batch processing during off-peak hours for non-urgent tasks',
      potentialSavings: 15,
    },
  ];

  analyzeOptimizationOpportunities(
    costHistory: CostMetrics[],
    timeframeHours: number = 24
  ): OptimizationInsight[] {
    const recentMetrics = this.filterRecentMetrics(costHistory, timeframeHours);
    const insights: OptimizationInsight[] = [];

    for (const rule of this.optimizationRules) {
      const triggered = rule.condition(recentMetrics);
      const totalCost = recentMetrics.reduce((sum, m) => sum + m.totalCost, 0);
      const estimatedSavings = totalCost * (rule.potentialSavings / 100);

      const impact: 'high' | 'medium' | 'low' =
        estimatedSavings > 10 ? 'high' : estimatedSavings > 1 ? 'medium' : 'low';

      insights.push({
        rule,
        triggered,
        impact,
        estimatedSavings,
      });
    }

    return insights.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  generateCostForecast(costHistory: CostMetrics[]): CostForecast {
    if (costHistory.length < 7) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        confidence: 0,
      };
    }

    // Use linear regression on daily costs
    const dailyCosts = this.aggregateDailyCosts(costHistory);
    const trend = this.calculateTrend(dailyCosts);

    const recentDailyCost = dailyCosts[dailyCosts.length - 1]?.cost || 0;
    const forecastDaily = Math.max(0, recentDailyCost + trend);

    const confidence = Math.min(1, dailyCosts.length / 30); // Full confidence after 30 days of data

    return {
      daily: forecastDaily,
      weekly: forecastDaily * 7,
      monthly: forecastDaily * 30,
      confidence,
    };
  }

  optimizeRequestConfiguration(
    requestText: string,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): {
    recommendedProvider: string;
    recommendedModel: string;
    maxTokens: number;
    temperature: number;
    reasoning: string;
  } {
    const tokenCount = this.estimateTokenCount(requestText);

    // Simple schema generation
    if (complexity === 'simple' || tokenCount < 100) {
      return {
        recommendedProvider: 'openai',
        recommendedModel: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0,
        reasoning: 'Simple task - using cost-effective model with low token limit',
      };
    }

    // Complex analysis
    if (complexity === 'complex' || tokenCount > 500) {
      return {
        recommendedProvider: 'anthropic',
        recommendedModel: 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.1,
        reasoning: 'Complex task requiring advanced reasoning capabilities',
      };
    }

    // Medium complexity (default)
    return {
      recommendedProvider: 'openai',
      recommendedModel: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0,
      reasoning: 'Balanced choice for medium complexity task',
    };
  }

  generateCostReport(costHistory: CostMetrics[]): {
    summary: {
      totalCost: number;
      totalRequests: number;
      averageCostPerRequest: number;
      costEfficiencyScore: number; // 0-100
    };
    breakdown: {
      byProvider: Record<string, { cost: number; requests: number; avgCost: number }>;
      byModel: Record<string, { cost: number; requests: number; avgCost: number }>;
      byTimeOfDay: Record<string, number>;
    };
    trends: {
      dailySpend: { date: string; cost: number }[];
      efficiencyTrend: { date: string; costPerToken: number }[];
    };
    recommendations: string[];
  } {
    const totalCost = costHistory.reduce((sum, m) => sum + m.totalCost, 0);
    const totalRequests = costHistory.length;
    const averageCostPerRequest = totalCost / totalRequests;

    // Calculate efficiency score (lower cost per token = higher score)
    const totalTokens = costHistory.reduce((sum, m) => sum + m.inputTokens + m.outputTokens, 0);
    const costPerToken = totalCost / totalTokens;
    const efficiencyScore = Math.max(0, Math.min(100, (0.00001 - costPerToken) * 1000000)); // Normalized score

    // Provider breakdown
    const byProvider: Record<string, { cost: number; requests: number; avgCost: number }> = {};
    const byModel: Record<string, { cost: number; requests: number; avgCost: number }> = {};
    const byTimeOfDay: Record<string, number> = {};

    costHistory.forEach(metric => {
      // Provider breakdown
      if (!byProvider[metric.provider]) {
        byProvider[metric.provider] = { cost: 0, requests: 0, avgCost: 0 };
      }
      byProvider[metric.provider].cost += metric.totalCost;
      byProvider[metric.provider].requests += 1;

      // Model breakdown
      if (!byModel[metric.model]) {
        byModel[metric.model] = { cost: 0, requests: 0, avgCost: 0 };
      }
      byModel[metric.model].cost += metric.totalCost;
      byModel[metric.model].requests += 1;

      // Time of day breakdown
      const hour = metric.timestamp.getHours();
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      byTimeOfDay[timeSlot] = (byTimeOfDay[timeSlot] || 0) + metric.totalCost;
    });

    // Calculate averages
    Object.values(byProvider).forEach(p => (p.avgCost = p.cost / p.requests));
    Object.values(byModel).forEach(m => (m.avgCost = m.cost / m.requests));

    // Generate trends
    const dailySpend = this.aggregateDailyCosts(costHistory).map(d => ({
      date: d.date,
      cost: d.cost,
    }));

    const efficiencyTrend = this.calculateEfficiencyTrend(costHistory);

    // Generate recommendations
    const insights = this.analyzeOptimizationOpportunities(costHistory);
    const recommendations = insights.filter(i => i.triggered).map(i => i.rule.recommendation);

    return {
      summary: {
        totalCost,
        totalRequests,
        averageCostPerRequest,
        costEfficiencyScore: efficiencyScore,
      },
      breakdown: {
        byProvider,
        byModel,
        byTimeOfDay,
      },
      trends: {
        dailySpend,
        efficiencyTrend,
      },
      recommendations,
    };
  }

  private filterRecentMetrics(metrics: CostMetrics[], hours: number): CostMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return metrics.filter(m => m.timestamp >= cutoff);
  }

  private getAverageCostByProvider(metrics: CostMetrics[]): Record<string, number> {
    const providerCosts: Record<string, { total: number; count: number }> = {};

    metrics.forEach(m => {
      if (!providerCosts[m.provider]) {
        providerCosts[m.provider] = { total: 0, count: 0 };
      }
      providerCosts[m.provider].total += m.totalCost;
      providerCosts[m.provider].count += 1;
    });

    const result: Record<string, number> = {};
    Object.entries(providerCosts).forEach(([provider, data]) => {
      result[provider] = data.total / data.count;
    });

    return result;
  }

  private estimateRetryRate(metrics: CostMetrics[]): number {
    // Simplified estimation - in real implementation, would track retries separately
    const avgCost = metrics.reduce((sum, m) => sum + m.totalCost, 0) / metrics.length;
    const highCostRequests = metrics.filter(m => m.totalCost > avgCost * 2).length;
    return highCostRequests / metrics.length;
  }

  private aggregateDailyCosts(metrics: CostMetrics[]): { date: string; cost: number }[] {
    const dailyCosts: Record<string, number> = {};

    metrics.forEach(m => {
      const date = m.timestamp.toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + m.totalCost;
    });

    return Object.entries(dailyCosts)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTrend(dailyCosts: { date: string; cost: number }[]): number {
    if (dailyCosts.length < 2) return 0;

    // Simple linear regression
    const n = dailyCosts.length;
    const sumX = dailyCosts.reduce((sum, _, i) => sum + i, 0);
    const sumY = dailyCosts.reduce((sum, d) => sum + d.cost, 0);
    const sumXY = dailyCosts.reduce((sum, d, i) => sum + i * d.cost, 0);
    const sumXX = dailyCosts.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope || 0;
  }

  private calculateEfficiencyTrend(
    metrics: CostMetrics[]
  ): { date: string; costPerToken: number }[] {
    const dailyMetrics: Record<string, { cost: number; tokens: number }> = {};

    metrics.forEach(m => {
      const date = m.timestamp.toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { cost: 0, tokens: 0 };
      }
      dailyMetrics[date].cost += m.totalCost;
      dailyMetrics[date].tokens += m.inputTokens + m.outputTokens;
    });

    return Object.entries(dailyMetrics)
      .map(([date, data]) => ({
        date,
        costPerToken: data.tokens > 0 ? data.cost / data.tokens : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
