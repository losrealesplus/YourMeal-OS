# YourMeal OS — EatClean Backup & Disaster Recovery Contract

## 1. Database Backups (Supabase)
- **Daily Automated Backups:** Enabled with 7-day retention.
- **Point-in-Time Recovery (PITR):** Continuous Write-Ahead Log (WAL) archiving allowing restoration to any millisecond within the retention window.
- **Pre-Onboarding Snapshot:** Mandatory manual backup taken immediately before running any batch ingest script (e.g. B3.9 Real Import).

## 2. Infrastructure Rollback Strategy
1. **Core Version Rollback:**
   - Modify `package.json` and `instance.config.ts` (`0.1.1` $\rightarrow$ `0.1.0`).
   - Trigger CI/CD deployment pipeline.
2. **Cloudflare Worker Rollback:**
   - Instant perimeter rollback via `npx wrangler rollback` (<5 seconds to previous worker version).
3. **Database Schema Rollback:**
   - Reversion of down-migrations or point-in-time restoration to pre-migration snapshot.
