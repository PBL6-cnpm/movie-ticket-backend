import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class EmailThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const email: string = req.body.email || req.user.email;

    if (email) {
      return email;
    }

    return super.getTracker(req);
  }
}
