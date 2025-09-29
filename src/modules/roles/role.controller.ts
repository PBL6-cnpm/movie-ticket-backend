import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleService } from './role.service';

@Controller('roles')
@ApiTags('Roles')
export class RoleController extends BaseController {
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
}
