import { Permission } from 'shared/db/entities/permission.entity';

export class PermissionInRole {
  id: string;
  name: string;
  isHas: boolean;

  constructor(permission: Permission, isHas: boolean) {
    this.id = permission.id;
    this.name = permission.name;
    this.isHas = isHas;
  }
}
