declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BID_FEED_KEY?: string;
    BID_FEED_MASTER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
