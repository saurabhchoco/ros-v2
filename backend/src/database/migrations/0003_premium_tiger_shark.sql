CREATE TABLE "order_items" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"order_id" varchar(40) NOT NULL,
	"menu_item_id" varchar(40),
	"item_name" varchar(255) NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40) NOT NULL,
	"order_no" varchar(100) NOT NULL,
	"order_source" varchar(50) NOT NULL,
	"order_status" varchar(50) NOT NULL,
	"customer_name" varchar(255),
	"customer_mobile" varchar(20),
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"grand_total" numeric(12, 2) NOT NULL,
	"payment_status" varchar(50) DEFAULT 'PENDING',
	"created_by" varchar(40),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
