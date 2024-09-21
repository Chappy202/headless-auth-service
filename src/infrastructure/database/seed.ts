import { DrizzleService } from './drizzle.service';
import {
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  resources,
} from './schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';

export async function seed(drizzle: DrizzleService, config: ConfigService) {
  const db = drizzle.db;

  // Check if the seed has already been run
  const [existingUser] = await db.select().from(users).limit(1);
  if (existingUser) {
    console.log('Seed data already exists. Skipping...');
    return;
  }

  console.log('Seeding initial data...');

  // Create roles
  const [superRole] = await db
    .insert(roles)
    .values({ name: 'super' })
    .returning();

  const [adminRole] = await db
    .insert(roles)
    .values({ name: 'admin' })
    .returning();

  const [userRole] = await db.insert(roles).values({ name: 'user' }).returning();

  // Create resources
  const [usersResource] = await db
    .insert(resources)
    .values({ name: 'users', description: 'User management' })
    .returning();

  const [rolesResource] = await db
    .insert(resources)
    .values({ name: 'roles', description: 'Role management' })
    .returning();

  const [permissionsResource] = await db
    .insert(resources)
    .values({ name: 'permissions', description: 'Permission management' })
    .returning();

  const [apiKeysResource] = await db
    .insert(resources)
    .values({ name: 'api-keys', description: 'API key management' })
    .returning();

  // Create permissions
  const createPermissions = async (
    resourceId: number,
    types: ('read' | 'write' | 'admin')[],
  ) => {
    // Fetch the resource name
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      console.error(`Resource with id ${resourceId} not found`);
      return;
    }

    for (const type of types) {
      await db.insert(permissions).values({
        name: `${type}:${resource.name}`,
        type,
        resourceId,
      });
    }
  };

  await createPermissions(usersResource.id, ['read', 'write', 'admin']);
  await createPermissions(rolesResource.id, ['read', 'write', 'admin']);
  await createPermissions(permissionsResource.id, ['read', 'write', 'admin']);
  await createPermissions(apiKeysResource.id, ['read', 'write', 'admin']);

  // Create super user permission
  const [superPermission] = await db
    .insert(permissions)
    .values({
      name: '*:*',
      type: 'admin',
      resourceId: null, // This represents a global resource
    })
    .returning();

  // Assign super permission to super role
  await db.insert(rolePermissions).values({
    roleId: superRole.id,
    permissionId: superPermission.id,
  });

  // Assign all permissions to admin role
  const allPermissions = await db.select().from(permissions);
  for (const permission of allPermissions) {
    await db.insert(rolePermissions).values({
      roleId: adminRole.id,
      permissionId: permission.id,
    });
  }

  // Assign read permissions to user role
  const readPermissions = allPermissions.filter((p) => p.type === 'read');
  for (const permission of readPermissions) {
    await db.insert(rolePermissions).values({
      roleId: userRole.id,
      permissionId: permission.id,
    });
  }

  // Create initial admin user
  const username = config.get('INITIAL_ADMIN_USERNAME') || 'admin';
  const password = config.get('INITIAL_ADMIN_PASSWORD') || 'adminpassword';
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
  console.log(`Initial admin user created with username: ${username}`);
  console.log('Please change the admin password after first login.');
}