import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../db/schema';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private _db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });

    this._db = drizzle(this.pool, { schema });

    // Run migrations
    await this.runMigrations();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  get db(): ReturnType<typeof drizzle> {
    return this._db;
  }

  private async runMigrations() {
    try {
      await migrate(this._db, { migrationsFolder: './drizzle', migrationsTable: '__auth_migrations' });
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }
}