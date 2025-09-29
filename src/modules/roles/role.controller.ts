import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'shared/db/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleService } from './role.service';

@Controller('roles')
@ApiTags('Roles')
export class RoleController extends BaseController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly roleService: RoleService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all role' })
  async getAllRole(): Promise<SuccessResponse<RoleResponseDto[]>> {
    const roleList = await this.roleService.findAll();
    const response = roleList.map((r) => new RoleResponseDto(r));

    return this.created(response);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new role' })
  async createNewRole(@Body() createRoleDto: CreateRoleDto): Promise<SuccessResponse<Role>> {
    const roleCreate = await this.roleService.createNewRole(createRoleDto);

    return this.created(roleCreate);
  }

  @Post('/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(@Body() body: { id: string }): Promise<SuccessResponse<null>> {
    await this.roleService.deleteRole(body.id);

    return this.created(null);
  }
}
