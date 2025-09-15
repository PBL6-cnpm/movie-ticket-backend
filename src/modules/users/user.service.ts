import { BaseService } from '@bases/baseService';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { NotFound } from '@common/exceptions/not-found.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../shared/db/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '@common/enums';

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
