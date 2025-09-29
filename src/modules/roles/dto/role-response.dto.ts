import { Role } from 'shared/db/entities/role.entity';

export class RoleResponseDto {
  id: string;
  name: string;

  constructor(role: Role) {
    this.id = role.id;
    this.name = role.name;
  }
}
