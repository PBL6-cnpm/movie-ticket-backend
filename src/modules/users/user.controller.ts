import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('Users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Create a new user' })
  // async createUser(
  //   @Body() createUserDto: CreateUserDto
  // ): Promise<SuccessResponse<UserResponseDto>> {
  //   const newUser = await this.userService.createUser(createUserDto);
  //   const response = new UserResponseDto(newUser);
  //   return this.created(response);
  // }

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
