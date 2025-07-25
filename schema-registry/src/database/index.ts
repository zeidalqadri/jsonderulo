import knex, { Knex } from 'knex';

let db: Knex;

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'jsonderulo',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'jsonderulo_registry',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  api_key: string;
  organization_id?: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

export interface Schema {
  id: string;
  name: string;
  description?: string;
  schema: any; // JSON schema object
  version: number;
  parent_id?: string; // For versioning
  owner_id: string;
  organization_id?: string;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  is_public: boolean;
  owner_id: string;
  organization_id?: string;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CostMetric {
  id: string;
  user_id: string;
  organization_id?: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  operation_type: 'schema_generation' | 'prompt_creation' | 'validation';
  metadata?: any;
  created_at: Date;
}

export class Database {
  static async initialize(): Promise<void> {
    db = knex(config);
    
    // Test connection
    try {
      await db.raw('SELECT 1');
      console.log('Database connection established');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }

    // Run migrations
    await db.migrate.latest();
    console.log('Database migrations completed');
  }

  static getConnection(): Knex {
    if (!db) {
      throw new Error('Database not initialized. Call Database.initialize() first.');
    }
    return db;
  }

  static async close(): Promise<void> {
    if (db) {
      await db.destroy();
      console.log('Database connection closed');
    }
  }

  // User operations
  static async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const [created] = await db('users')
      .insert({
        ...user,
        id: crypto.randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return created;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    return user || null;
  }

  static async getUserByApiKey(apiKey: string): Promise<User | null> {
    const user = await db('users').where({ api_key: apiKey }).first();
    return user || null;
  }

  // Schema operations
  static async createSchema(schema: Omit<Schema, 'id' | 'created_at' | 'updated_at'>): Promise<Schema> {
    const [created] = await db('schemas')
      .insert({
        ...schema,
        id: crypto.randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return created;
  }

  static async getSchema(id: string): Promise<Schema | null> {
    const schema = await db('schemas').where({ id }).first();
    return schema || null;
  }

  static async getSchemasByOwner(ownerId: string, limit = 50, offset = 0): Promise<Schema[]> {
    return db('schemas')
      .where({ owner_id: ownerId })
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async searchSchemas(
    query: string,
    isPublic = false,
    limit = 50,
    offset = 0
  ): Promise<Schema[]> {
    let queryBuilder = db('schemas');
    
    if (isPublic) {
      queryBuilder = queryBuilder.where({ is_public: true });
    }

    return queryBuilder
      .where('name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`)
      .orderBy('usage_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async updateSchema(id: string, updates: Partial<Schema>): Promise<Schema | null> {
    const [updated] = await db('schemas')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');
    return updated || null;
  }

  static async deleteSchema(id: string): Promise<boolean> {
    const deleted = await db('schemas').where({ id }).del();
    return deleted > 0;
  }

  static async incrementSchemaUsage(id: string): Promise<void> {
    await db('schemas').where({ id }).increment('usage_count', 1);
  }

  // Template operations
  static async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const [created] = await db('templates')
      .insert({
        ...template,
        id: crypto.randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return created;
  }

  static async getTemplates(isPublic = false, limit = 50, offset = 0): Promise<Template[]> {
    let queryBuilder = db('templates');
    
    if (isPublic) {
      queryBuilder = queryBuilder.where({ is_public: true });
    }

    return queryBuilder
      .orderBy('usage_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async getTemplate(id: string): Promise<Template | null> {
    const template = await db('templates').where({ id }).first();
    return template || null;
  }

  // Cost metrics operations
  static async recordCostMetric(metric: Omit<CostMetric, 'id' | 'created_at'>): Promise<CostMetric> {
    const [created] = await db('cost_metrics')
      .insert({
        ...metric,
        id: crypto.randomUUID(),
        created_at: new Date(),
      })
      .returning('*');
    return created;
  }

  static async getCostMetrics(
    userId: string,
    organizationId?: string,
    hours = 24
  ): Promise<CostMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let queryBuilder = db('cost_metrics')
      .where('created_at', '>=', cutoff)
      .orderBy('created_at', 'desc');

    if (organizationId) {
      queryBuilder = queryBuilder.where({ organization_id: organizationId });
    } else {
      queryBuilder = queryBuilder.where({ user_id: userId });
    }

    return queryBuilder;
  }

  static async getTotalCost(userId: string, organizationId?: string, hours = 24): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let queryBuilder = db('cost_metrics')
      .where('created_at', '>=', cutoff)
      .sum('total_cost as total');

    if (organizationId) {
      queryBuilder = queryBuilder.where({ organization_id: organizationId });
    } else {
      queryBuilder = queryBuilder.where({ user_id: userId });
    }

    const result = await queryBuilder.first();
    return parseFloat(result?.total || '0');
  }
}