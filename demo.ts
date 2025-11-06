import 'dotenv/config';
import { Redis } from 'ioredis';
const logger = {
  error: console.error,
  log: console.log
};

class MockRedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT)
    });
    logger.log('Connecting to Redis...');
  }

  async trySetNx(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      return (await this.redis.set(key, value, 'EX', ttl, 'NX')) === 'OK';
    } catch (error) {
      logger.error('Redis set NX failed', error.stack);
      throw error;
    }
  }

  async cleanup(key: string) {
    await this.redis.del(key);
  }

  async disconnect() {
    await this.redis.quit();
  }
}

const TOTAL_REQUESTS = 10000;
const RESOURCE_KEY = 'seat_lock:showtime_123:seat_A11';
const LOCK_TTL_SECONDS = 300; // 5 minutes

async function simulateRequest(
  service: MockRedisService,
  userId: number
): Promise<'success' | 'fail'> {
  const userValue = `user_${userId}`;

  const gotLock = await service.trySetNx(RESOURCE_KEY, userValue, LOCK_TTL_SECONDS);

  if (gotLock) {
    logger.log(`\n🏆 USER ${userId} WON! Acquired the lock.\n`);
    return 'success';
  } else {
    return 'fail';
  }
}

async function runTest() {
  const service = new MockRedisService();

  await service.cleanup(RESOURCE_KEY);

  const requests: Promise<'success' | 'fail'>[] = [];
  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    requests.push(simulateRequest(service, i));
  }

  const results = await Promise.all(requests);

  const successCount = results.filter((r) => r === 'success').length;
  const failCount = results.filter((r) => r === 'fail').length;

  console.log('\n--- 🏁 TEST RESULTS ---');
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`✅ Successful Lock Acquisitions: ${successCount}`);
  console.log(`❌ Failed Lock Attempts:     ${failCount}`);

  //   await service.cleanup(RESOURCE_KEY);
  await service.disconnect();
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
});
