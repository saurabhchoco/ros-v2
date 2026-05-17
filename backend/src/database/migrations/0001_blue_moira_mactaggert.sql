CREATE TABLE "outlets" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"outlet_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
