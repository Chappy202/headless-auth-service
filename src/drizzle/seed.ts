// src/drizzle/seed.ts

import { DrizzleService } from './drizzle.service';
import {
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from './schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export async function seed(drizzle: DrizzleService, config: ConfigService) {
  const db = drizzle.db;

  // Check if the seed has already been run
  const [existingUser] = await db.select().from(users).limit(1);
  if (existingUser) {
    console.log('Seed data already exists. Skipping...');
    return;
  }

  console.log('Seeding initial data...');

  // Create super user permission
  const [superPermission] = await db
    .insert(permissions)
    .values({
      name: '*:*',
      type: 'admin',
      resourceId: null, // This represents a global resource
    })
    .returning();

  // Create super role
  const [superRole] = await db
    .insert(roles)
    .values({
      name: 'super',
    })
    .returning();

  // Assign super permission to super role
  await db.insert(rolePermissions).values({
    roleId: superRole.id,
    permissionId: superPermission.id,
  });

  // Create initial admin user
  const username = config.get('INITIAL_ADMIN_USERNAME') || 'Admin';
  const password = config.get('INITIAL_ADMIN_PASSWORD') || 'SecurePassword01';
  const hashedPassword = await bcrypt.hash(password, 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      username,
      password: hashedPassword,
      isEmailVerified: true,
    })
    .returning();

  // Assign super role to admin user
  await db.insert(userRoles).values({
    userId: adminUser.id,
    roleId: superRole.id,
  });

  console.log('Seed completed successfully.');
}
