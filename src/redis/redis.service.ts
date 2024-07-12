// src/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL'));
  }

  getClient(): Redis {
    return this.redis;
  }
}
