import { RequestInfoType } from '@common/types/request-info.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TestService {
  getAdminData(ctx: RequestInfoType) {
    console.log('>>>>>>>>>>>>>>>>>>>>Request user:', ctx.user);
    return { message: 'Admin data: only admin can access' };
  }

  getEmployeeData() {
    return { message: 'Employee data: only employee_user can access' };
  }

  updateUser() {
    return { message: 'Update user: need update:user permission' };
  }
}
