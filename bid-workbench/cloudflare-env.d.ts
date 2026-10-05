declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    AUTH_MODE?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    MASTER_EMAIL?: string;
    LOCAL_DEMO?: string;
    INTELLIGENCE_FEED_URL?: string;
    INTELLIGENCE_FEED_KEY?: string;
    INTELLIGENCE_SITES_TOKEN?: string;
  }
}
