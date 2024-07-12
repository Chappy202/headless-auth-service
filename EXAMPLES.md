## Implement permission guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from './permission.decorator';
import { PermissionGuard } from './permission.guard';

@Controller('inspections')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class InspectionsController {
  @Get()
  @RequirePermission('read:inspections')
  getInspections() {
    // ... implementation
  }

  @Post()
  @RequirePermission('write:inspections')
  createInspection() {
    // ... implementation
  }

  @Delete(':id')
  @RequirePermission('write:inspections')
  deleteInspection() {
    // ... implementation
  }
}
```

### Setup permissions logic

```typescript
async function setupPermissions(permissionService: PermissionService) {
  const inspectionsResource = await permissionService.createResource(
    'inspections',
    'Inspection management',
  );

  await permissionService.createPermission(inspectionsResource.id, 'read');
  await permissionService.createPermission(inspectionsResource.id, 'write');
  await permissionService.createPermission(inspectionsResource.id, 'admin');

  // Assign permissions to roles or users
  // ...
}
```

### Check user permission in react

```typescript
 import React from 'react';
import { usePermissions } from './usePermissions'; // A custom hook to access permissions

function SecureComponent({ requiredPermission }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(requiredPermission)) {
    return <div>You don't have permission to view this.</div>;
  }

  return (
    <div>
      {/* Your secure content here */}
    </div>
  );
}
```
