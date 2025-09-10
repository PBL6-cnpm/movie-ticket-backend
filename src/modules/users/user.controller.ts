import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController } from '@bases/baseController';
import { UserResponseDto } from './dto/user-response.dto';
import { SuccessResponse } from '@common/interfaces/api-response.interface';

@Controller('users')
@ApiTags('Users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(
    @Body() createUserDto: CreateUserDto
  ): Promise<SuccessResponse<UserResponseDto>> {
    const newUser = await this.userService.createUser(createUserDto);
    const response = new UserResponseDto(newUser);
    return this.created(response);
  }
}
