import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { resources, permissions } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateResourceDto } from '../dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private drizzle: DrizzleService) {}

  async createResource(createResourceDto: CreateResourceDto) {
    const [resource] = await this.drizzle.db
      .insert(resources)
      .values(createResourceDto)
      .returning();
    return resource;
  }

  async getResources() {
    return this.drizzle.db.select().from(resources);
  }

  async getResourceById(id: number) {
    const [resource] = await this.drizzle.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async getResourcePermissions(resourceId: number) {
    return this.drizzle.db
      .select()
      .from(permissions)
      .where(eq(permissions.resourceId, resourceId));
  }
}
