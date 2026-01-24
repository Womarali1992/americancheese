CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"parent_id" integer,
	"level" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"project_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_template_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_set_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"parent_slug" text,
	"level" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_template_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'each' NOT NULL,
	"unit_price" double precision DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"company_name" text NOT NULL,
	"company_address" text NOT NULL,
	"company_phone" text,
	"company_email" text,
	"client_name" text NOT NULL,
	"client_address" text,
	"client_email" text,
	"client_phone" text,
	"project_id" integer,
	"project_name" text,
	"work_period" text,
	"subtotal" double precision DEFAULT 0 NOT NULL,
	"tax_rate" double precision DEFAULT 0,
	"tax_amount" double precision DEFAULT 0,
	"discount_amount" double precision DEFAULT 0,
	"discount_description" text,
	"total" double precision DEFAULT 0 NOT NULL,
	"payment_terms" text DEFAULT 'Net 30 days' NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "labor" ALTER COLUMN "tier1_category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "labor" ALTER COLUMN "tier2_category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "tier" SET DEFAULT 'subcategory-one';--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "tier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "tier1_category" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "tier1_category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "tier2_category" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "tier2_category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_item_comments" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "labor" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "labor" ADD COLUMN "subtask_id" integer;--> statement-breakpoint
ALTER TABLE "labor" ADD COLUMN "work_description" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "category_id" integer;