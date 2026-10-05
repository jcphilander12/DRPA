import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const observations = sqliteTable("observations", {
  id: text("id").primaryKey(), tenant: text("tenant").notNull(), site: text("site").notNull(), period: text("period").notNull(),
  metric: text("metric").notNull(), numerator: real("numerator").notNull(), denominator: real("denominator").notNull(),
  status: text("status").notNull(), source: text("source").notNull(), note: text("note").notNull(),
  actor: text("actor").notNull(), updated: text("updated").notNull(), version: integer("version").notNull().default(1), details:text("details").notNull().default("{}")
}, t => [uniqueIndex("uq_observation_grain").on(t.tenant,t.site,t.period,t.metric),index("idx_observation_scope").on(t.tenant,t.period,t.status)]);
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(), tenant: text("tenant").notNull(), site: text("site").notNull(), period: text("period").notNull(),
  metric: text("metric").notNull(), numerator: real("numerator").notNull(), denominator: real("denominator").notNull(),
  source: text("source").notNull(), note: text("note").notNull(), actor: text("actor").notNull(),
  status: text("status").notNull(), created: text("created").notNull(), reviewedBy: text("reviewed_by"), reviewed: text("reviewed"), baseVersion: integer("base_version").notNull().default(0), details:text("details").notNull().default("{}")
}, t => [index("idx_submission_queue").on(t.tenant,t.status)]);
export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),tenant: text("tenant").notNull(),actor:text("actor").notNull(),action:text("action").notNull(),
  entity:text("entity").notNull(),detail:text("detail").notNull(),created:text("created").notNull()
},t=>[index("idx_audit_tenant_created").on(t.tenant,t.created)]);
export const bidDrafts = sqliteTable("bid_drafts", {
  id:text("id").primaryKey(),tenant:text("tenant").notNull(),title:text("title").notNull(),question:text("question").notNull(),
  content:text("content").notNull(),sources:text("sources").notNull(),mode:text("mode").notNull(),status:text("status").notNull(),
  actor:text("actor").notNull(),created:text("created").notNull(),version:integer("version").notNull().default(1)
},t=>[index("idx_bid_tenant_created").on(t.tenant,t.created)]);
export const evidenceDocuments = sqliteTable("evidence_documents", {
 id:text("id").primaryKey(),tenant:text("tenant").notNull(),title:text("title").notNull(),filename:text("filename").notNull(),
 department:text("department").notNull(),site:text("site").notNull().default("company"),mime:text("mime").notNull(),size:integer("size").notNull(),objectKey:text("object_key").notNull(),
 status:text("status").notNull(),actor:text("actor").notNull(),created:text("created").notNull()
},t=>[index("idx_documents_tenant_department").on(t.tenant,t.department)]);
export const platformRecords=sqliteTable("platform_records",{
 id:text("id").primaryKey(),tenant:text("tenant").notNull(),kind:text("kind").notNull(),payload:text("payload").notNull(),version:integer("version").notNull().default(1),created:text("created").notNull(),updated:text("updated").notNull()
},t=>[index("idx_platform_records_scope").on(t.tenant,t.kind)]);
export const integrationVault=sqliteTable("integration_vault",{
 id:text("id").primaryKey(),tenant:text("tenant").notNull(),owner:text("owner").notNull(),provider:text("provider").notNull(),encrypted:text("encrypted").notNull(),updated:text("updated").notNull()
},t=>[uniqueIndex("uq_integration_owner").on(t.tenant,t.owner,t.provider)]);
