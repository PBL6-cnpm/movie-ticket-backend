import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { RoleName } from '@common/enums';
import { NotFound } from '@common/exceptions/not-found.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'shared/db/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>
  ) {
    super(roleRepo);
  }

  async getRoleIdByName(name: RoleName): Promise<string> {
    const role = await this.findOne({ where: { name } });

    if (!role) {
      throw new NotFound(RESPONSE_MESSAGES.ROLE_NOT_FOUND);
    }

    return role.id;
  }

  async getRoleByName(name: RoleName): Promise<Role> {
    const role = await this.findOne({ where: { name } });

    if (!role) {
      throw new NotFound(RESPONSE_MESSAGES.ROLE_NOT_FOUND);
    }

    return role;
  }
}
