import { BaseController } from '@bases/base-controller';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';

@Controller('roles')
@ApiTags('Roles')
export class RoleController extends BaseController {
  constructor(private readonly roleService: RoleService) {
    super();
  }
}
