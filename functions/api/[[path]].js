/**
 * Unified Jsonderulo API - Main entry point
 * Consolidates v1 and v2 endpoints into a single, feature-complete API
 * 
 * This replaces the previous separate implementations with a unified approach
 * that provides all capabilities through a consistent interface.
 * 
 * Available endpoints:
 * - /api/health - System health and feature status
 * - /api/templates - Template management
 * - /api/speak - Universal prompt generation (replaces /pipeline/execute)
 * - /api/optimize-prompt - Dedicated prompt optimization
 * - /api/schema/generate - JSON schema generation
 * - /api/validate - JSON validation and repair
 * - /api/executions - Execution history
 * - /api/analytics - Usage analytics
 * - /api/context/add - Context management (V2)
 * - /api/context/search - Context search (V2)
 * - /api/consistency - Self-consistency checking (V2)
 * - /api/quality/metrics - Quality tracking (V2)
 * - /api/abtest - A/B testing (V2)
 * - /api/features - Feature documentation (V2)
 * - /api/demo - Feature demonstrations (V2)
 */

// Import the unified implementation
import { onRequest as unifiedHandler } from './unified.js';

// Export the unified handler as the main API entry point
export const onRequest = unifiedHandler;