CREATE TABLE "category_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" integer,
	"color" text,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_item_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_item_id" integer NOT NULL,
	"content" text NOT NULL,
	"author_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"section" text,
	"assigned_to" text,
	"due_date" date,
	"contact_ids" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text,
	"phone" text,
	"email" text,
	"type" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"initials" text
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"project_id" integer NOT NULL,
	"vendor" text,
	"material_ids" text[],
	"contact_ids" text[],
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "global_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "labor" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"tier1_category" text NOT NULL,
	"tier2_category" text NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"email" text,
	"project_id" integer NOT NULL,
	"task_id" integer,
	"contact_id" integer NOT NULL,
	"work_date" date NOT NULL,
	"task_description" text,
	"area_of_work" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"total_hours" double precision,
	"labor_cost" double precision,
	"units_completed" text,
	"is_quote" boolean DEFAULT false,
	"material_ids" text[],
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"material_size" text,
	"type" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"tier" text DEFAULT 'structural' NOT NULL,
	"tier2category" text,
	"section" text,
	"subsection" text,
	"quantity" integer NOT NULL,
	"supplier" text,
	"supplier_id" integer,
	"status" text DEFAULT 'ordered' NOT NULL,
	"is_quote" boolean DEFAULT false,
	"project_id" integer NOT NULL,
	"task_ids" text[],
	"contact_ids" text[],
	"unit" text,
	"cost" double precision,
	"details" text,
	"quote_date" date,
	"quote_number" text,
	"order_date" date
);
--> statement-breakpoint
CREATE TABLE "project_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" integer,
	"color" text,
	"description" text,
	"template_id" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"hidden_categories" text[],
	"selected_templates" text[],
	"color_theme" text,
	"use_global_theme" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "section_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"section_index" integer NOT NULL,
	"content" text NOT NULL,
	"author_name" text NOT NULL,
	"author_contact_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "section_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"combined_sections" text[],
	"caution_sections" text[],
	"flagged_sections" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subtask_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"subtask_id" integer NOT NULL,
	"content" text NOT NULL,
	"author_name" text NOT NULL,
	"section_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subtasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_task_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"assigned_to" text,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'not_started' NOT NULL,
	"estimated_cost" double precision,
	"actual_cost" double precision
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_content" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"type" text DEFAULT 'document' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tier1_category_id" integer NOT NULL,
	"tier2_category_id" integer NOT NULL,
	"estimated_duration" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_id" integer NOT NULL,
	"tier1_category" text DEFAULT 'Structural' NOT NULL,
	"tier2_category" text DEFAULT 'Foundation' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"materials_needed" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"assigned_to" text,
	"completed" boolean DEFAULT false,
	"contact_ids" text[],
	"material_ids" text[],
	"template_id" text,
	"estimated_cost" double precision,
	"actual_cost" double precision,
	"parent_task_id" integer,
	"sort_order" integer DEFAULT 0
);
