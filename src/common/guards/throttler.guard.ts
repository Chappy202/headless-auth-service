import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // ExpressJS
  // protected async getTracker(req: Record<string, any>): Promise<string> {
  //   return req.ips.length ? req.ips[0] : req.ip;
  // }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
}
