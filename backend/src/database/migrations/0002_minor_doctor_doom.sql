CREATE TABLE "users" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"firebase_uid" varchar(255) NOT NULL,
	"organization_id" varchar(40) NOT NULL,
	"outlet_id" varchar(40),
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
