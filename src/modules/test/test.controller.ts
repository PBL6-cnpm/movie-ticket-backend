import { Permissions } from '@common/decorators/permissions.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequestInfoType } from '@common/types/request-info.type';
import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { TestService } from './test.service';
@UseGuards(PermissionsGuard)
@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('admin')
  @Roles('admin')
  getAdminData(@Request() ctx: RequestInfoType) {
    return this.testService.getAdminData(ctx);
  }

  @Permissions('manage_movie')
  @Get('movie')
  manageMovie() {
    return { message: 'Chỉ user có quyền manage_movie mới truy cập được.' };
  }

  @Roles('customer')
  @Get('customer')
  getCustomerData() {
    return { message: 'Chỉ customer mới truy cập được.' };
  }

  @Get('public')
  getPublicData() {
    return { message: 'Ai cũng truy cập được.' };
  }
  getEmployeeData() {
    return this.testService.getEmployeeData();
  }

  @Post('update-user')
  @Permissions('update:user')
  updateUser() {
    return this.testService.updateUser();
  }
}
