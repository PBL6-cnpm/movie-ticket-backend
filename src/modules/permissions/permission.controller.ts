import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { RolePermissionService } from '@modules/role-permission/role-permission.service';
import { PermissionInRole } from '@modules/roles/dto/permission-in-role.dto';
import { RoleService } from '@modules/roles/role.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolePermission } from 'shared/db/entities/role-permission.entity';
import { Role } from 'shared/db/entities/role.entity';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PermissionUpdateResponseDto } from './dto/permission-update-response.dto';
import { PermissionService } from './permission.service';

@Controller('permissions')
@ApiTags('Permissions')
export class PermissionController extends BaseController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService
  ) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permission' })
  async getAllPermission(): Promise<SuccessResponse<PermissionResponseDto[]>> {
    const permissionList = await this.permissionService.findAll();
    const response = permissionList.map((p) => new PermissionResponseDto(p));

    return this.created(response);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get permission by role' })
  async getPermissionByRoleId(
    @Param('id') id: string
  ): Promise<SuccessResponse<PermissionInRole[]>> {
    // 1. Kiểm tra role tồn tại
    const role = await this.roleService.findOne({ where: { id }, relations: ['rolePermissions'] });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    // 2. Lấy tất cả permission
    const permissions = await this.permissionService.findAll();

    if (!permissions) {
      throw new NotFoundException(`Permission all not found 1`);
    }

    // 3. Xác định role có permission hay không
    const permissionInRoles: PermissionInRole[] = permissions.map((perm) => {
      const isHas = role.rolePermissions.some((p) => p.permissionId === perm.id);
      return new PermissionInRole(perm, isHas);
    });

    return this.created(permissionInRoles);
  }

  @Post(':id/save-permission')
  async savePermissionByRoleId(
    @Param('id') id: string,
    @Body('detailedPermissions') detailedPermissions: PermissionUpdateResponseDto[]
  ): Promise<SuccessResponse<string>> {
    if (!id) {
      throw new NotFoundException(`id ${id} not found`);
    }

    const role: Role = await this.roleService.findOneById(id);

    if (!role) {
      throw new NotFoundException(`Role of id: ${id} not found`);
    }

    await this.rolePermissionService.deleteBy({ roleId: id });

    const permissionInRole: RolePermission[] = [];

    await Promise.all(
      detailedPermissions.map(async (permInRole) => {
        if (permInRole.isHas) {
          const permission = await this.permissionService.findOneById(permInRole.id);

          if (permission) {
            permissionInRole.push(
              await this.rolePermissionService.create({
                role,
                permission
              })
            );
          }
        }
      })
    );

    await this.rolePermissionService.savePermissionInRole(permissionInRole);

    return this.success('Permissions updated successfully');
  }
}
