import { Permission } from './../../../shared/db/entities/permission.entity';
export class PermissionResponseDto {
  id: string;
  name: string;

  constructor(permission: Permission) {
    this.id = permission.id;
    this.name = permission.name;
  }
}
