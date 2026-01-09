// Simple in-memory cache for hotel searches
// In production, use Redis

class HotelCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 30 * 60 * 1000; // 30 minutes
  }

  generateKey(params) {
    const { city, checkIn, checkOut, adults, page } = params;
    return `${city}-${checkIn}-${checkOut}-${adults}-${page}`.toLowerCase();
  }

  get(params) {
    const key = this.generateKey(params);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT for: ${key}`);
    return cached.data;
  }

  set(params, data) {
    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`💾 Cached hotels for: ${key}`);

    // Auto-cleanup old entries (keep max 100 entries)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
    console.log("🗑️ Cache cleared");
  }
}

module.exports = new HotelCache();
