import {
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  pgSchema,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const permissionTypeEnum = pgEnum('permission_type', [
  'admin',
  'read',
  'write',
  '*',
]);

export const users = authSchema.table('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  password: text('password').notNull(),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: varchar('mfa_secret', { length: 32 }),
});

export const sessions = authSchema.table('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  isActive: boolean('is_active').default(true),
});

export const loginHistory = authSchema.table('login_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  ip: varchar('ip', { length: 45 }).notNull(),
  location: varchar('location', { length: 255 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resources = authSchema.table('resources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
});

export const roles = authSchema.table('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

export const permissions = authSchema.table('permissions', {
  id: serial('id').primaryKey(),
  resourceId: integer('resource_id').references(() => resources.id),
  type: permissionTypeEnum('type').notNull(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const rolePermissions = authSchema.table('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id),
  permissionId: integer('permission_id').references(() => permissions.id),
});

export const userPermissions = authSchema.table('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  permissionId: integer('permission_id').references(() => permissions.id),
});

export const userRoles = authSchema.table('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  roleId: integer('role_id').references(() => roles.id),
});

export const apiKeys = authSchema.table('api_keys', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});
