CREATE TABLE "item_unit_conversions" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"from_unit_id" varchar(40) NOT NULL,
	"to_unit_id" varchar(40) NOT NULL,
	"conversion_factor" numeric(18, 6) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "master_items" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"item_code" varchar(100),
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"item_type" varchar(50) NOT NULL,
	"primary_unit_id" varchar(40) NOT NULL,
	"default_vendor_id" varchar(40),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_master_items_org_normalized_name" UNIQUE("organization_id","normalized_name")
);
--> statement-breakpoint
CREATE TABLE "outlet_categories" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outlet_item_categories" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40) NOT NULL,
	"master_item_id" varchar(40) NOT NULL,
	"category_id" varchar(40) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"unit_type" varchar(50) NOT NULL,
	"is_base_unit" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_units_org_name" UNIQUE("organization_id","name"),
	CONSTRAINT "uq_units_org_symbol" UNIQUE("organization_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"vendor_code" varchar(100),
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"gst_number" varchar(100),
	"address" varchar(1000),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_vendors_org_name" UNIQUE("organization_id","name")
);
