import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

class SessionManager {
  constructor() {
    this.useRedis = false;
    this.redisClient = null;
    this.inMemorySessions = new Map();
    this.sessionTTL = parseInt(process.env.SESSION_TTL) || 1800; // 30 minutes default
    this.maxSessions = parseInt(process.env.MAX_SESSIONS) || 1000;
  }

  async initialize() {
    // Try to connect to Redis if configured
    if (process.env.REDIS_HOST) {
      try {
        this.redisClient = createClient({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379
          },
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.REDIS_DB) || 0
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
          this.useRedis = false;
        });

        await this.redisClient.connect();
        this.useRedis = true;
        const okIcon = process.platform === 'win32' ? '[OK]' : '✅';
        console.log(`${okIcon} Connected to Redis for session storage`);
      } catch (error) {
        const warnIcon = process.platform === 'win32' ? '[WARN]' : '⚠️ ';
        console.warn(`${warnIcon} Redis unavailable, using in-memory sessions:`, error.message);
        this.useRedis = false;
      }
    } else {
      const infoIcon = process.platform === 'win32' ? '[INFO]' : 'ℹ️ ';
      console.log(`${infoIcon} Using in-memory session storage`);
    }

    // Clean up old in-memory sessions periodically
    if (!this.useRedis) {
      setInterval(() => this.cleanupInMemorySessions(), 60000); // Every minute
    }
  }

  async getSession(callId) {
    if (!callId) {
      throw new Error('Call ID is required');
    }

    if (this.useRedis) {
      const data = await this.redisClient.get(`session:${callId}`);
      if (data) {
        return JSON.parse(data);
      }
    } else {
      const session = this.inMemorySessions.get(callId);
      if (session && Date.now() - session.lastAccessed < this.sessionTTL * 1000) {
        session.lastAccessed = Date.now();
        return session.data;
      }
    }

    // Create new session if not found
    return this.createSession(callId);
  }

  createSession(callId) {
    const sessionData = {
      callId,
      cart: [],
      metadata: {
        startTime: new Date().toISOString(),
        pickupTime: null,
        estimatedReadyTime: null,
        customerName: null,
        customerPhone: null,
        orderHistory: []
      }
    };

    return sessionData;
  }

  async saveSession(callId, sessionData) {
    if (!callId) {
      throw new Error('Call ID is required');
    }

    if (this.useRedis) {
      await this.redisClient.setEx(
        `session:${callId}`,
        this.sessionTTL,
        JSON.stringify(sessionData)
      );
    } else {
      // Check max sessions limit
      if (this.inMemorySessions.size >= this.maxSessions) {
        // Remove oldest session
        const oldestKey = this.inMemorySessions.keys().next().value;
        this.inMemorySessions.delete(oldestKey);
      }

      this.inMemorySessions.set(callId, {
        data: sessionData,
        lastAccessed: Date.now()
      });
    }
  }

  async deleteSession(callId) {
    if (this.useRedis) {
      await this.redisClient.del(`session:${callId}`);
    } else {
      this.inMemorySessions.delete(callId);
    }
  }

  cleanupInMemorySessions() {
    const now = Date.now();
    const ttlMs = this.sessionTTL * 1000;

    for (const [callId, session] of this.inMemorySessions.entries()) {
      if (now - session.lastAccessed > ttlMs) {
        this.inMemorySessions.delete(callId);
      }
    }
  }

  async storeCustomerData(phoneNumber, data) {
    const key = `customer:${phoneNumber}`;

    if (this.useRedis) {
      await this.redisClient.setEx(
        key,
        86400 * 365, // 1 year
        JSON.stringify(data)
      );
    } else {
      // For in-memory, we'll keep it simple and just store it
      this.inMemorySessions.set(key, {
        data,
        lastAccessed: Date.now()
      });
    }
  }

  async getCustomerData(phoneNumber) {
    const key = `customer:${phoneNumber}`;

    if (this.useRedis) {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      const session = this.inMemorySessions.get(key);
      return session ? session.data : null;
    }
  }

  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export default new SessionManager();
