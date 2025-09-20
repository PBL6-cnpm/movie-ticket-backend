import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus } from '@common/enums/account.enum';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { NotFound } from '@common/exceptions/not-found.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Account } from 'shared/db/entities/account.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService extends BaseService<Account> {
  constructor(
    @InjectRepository(Account)
    private readonly userRepo: Repository<Account>
  ) {
    super(userRepo);
  }

  async createUser(createUserDto: CreateUserDto): Promise<Account> {
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
      status: createUserDto.status || AccountStatus.PENDING
    });

    return newUser;
  }

  async getUserById(userId: string): Promise<Account> {
    const user = await this.findOneById(userId);

    if (!user) {
      throw new NotFound(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}
