import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from './enums/user.enum';
import { BaseService } from '@bases/baseService';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { NotFound } from '@common/exceptions/not-found.exception';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {
    super(userRepo);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findOne({
      where: { email: createUserDto.email }
    });
    if (existingUser) {
      throw new BadRequest(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const newUser = await this.create({
      ...createUserDto,
      password: hashedPassword,
      status: createUserDto.status || UserStatus.INACTIVE
    });

    return newUser;
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.findOneById(userId);

    if (!user) {
      throw new NotFound(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}
