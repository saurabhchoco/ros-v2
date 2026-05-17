CREATE TABLE "menu_categories" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40) NOT NULL,
	"category_id" varchar(40) NOT NULL,
	"item_code" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"base_price" numeric(12, 2) NOT NULL,
	"tax_percentage" numeric(5, 2) DEFAULT '0',
	"is_veg" boolean DEFAULT false,
	"is_available" boolean DEFAULT true,
	"image_url" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
