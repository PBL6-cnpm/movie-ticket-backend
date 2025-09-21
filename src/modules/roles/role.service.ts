import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'shared/db/entities/role.entity';
import { Injectable } from '@nestjs/common';
import { BaseService } from '@bases/base-service';
import { RoleName } from '@common/enums';
import { NotFound } from '@common/exceptions/not-found.exception';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';

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
}
