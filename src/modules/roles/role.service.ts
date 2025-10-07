import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { RoleName } from '@common/enums';
import { NotFound } from '@common/exceptions';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@shared/db/entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService extends BaseService<Role> {
  private readonly logger = new Logger(RoleService.name);

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
  async getRolesOfUser(userId: string): Promise<Role[]> {
    // Lấy các role của user thông qua bảng AccountRole
    return this.roleRepo
      .createQueryBuilder('role')
      .innerJoin('role.accountRoles', 'accountRole', 'accountRole.accountId = :userId', { userId })
      .getMany();
  }

  async createNewRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const exists = await this.roleRepo.findOne({ where: { name: createRoleDto.name } });
    if (exists) {
      throw new ConflictException('Role already exists');
    }

    const role = this.roleRepo.create(createRoleDto);
    return this.roleRepo.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    if (!id) {
      throw new NotFoundException(`Id ${id} not found`);
    }

    const role = await this.roleRepo.findOne({
      where: { id }
    });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    await this.roleRepo.remove(role);
  }
}
