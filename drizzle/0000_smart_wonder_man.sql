CREATE TABLE "point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"points_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	CONSTRAINT "point_transactions_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "points_gte_0" CHECK ("point_transactions"."points" >= 0),
	CONSTRAINT "points_used_gte_0_lte_points" CHECK (("point_transactions"."points_used" >= 0 and "point_transactions"."points_used" <= "point_transactions"."points"))
);
--> statement-breakpoint
CREATE INDEX "customer_idx" ON "point_transactions" USING btree ("customer_id") WHERE "point_transactions"."removed_at" is not null;--> statement-breakpoint
CREATE INDEX "order_idx" ON "point_transactions" USING btree ("order_id") WHERE "point_transactions"."removed_at" is not null;--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "point_transactions" USING btree ("created_at") WHERE "point_transactions"."removed_at" is not null;