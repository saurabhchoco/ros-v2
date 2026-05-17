CREATE TABLE "audit_logs" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40),
	"user_id" varchar(40),
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(40) NOT NULL,
	"old_value" json,
	"new_value" json,
	"created_at" timestamp DEFAULT now()
);
