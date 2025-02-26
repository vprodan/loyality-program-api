CREATE TABLE "point_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"earned" integer NOT NULL,
	"available" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	CONSTRAINT "point_transaction_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "earned_gte_0" CHECK ("point_transaction"."earned" > 0),
	CONSTRAINT "available_gte_0_lte_earned" CHECK (("point_transaction"."available" >= 0 and "point_transaction"."available" <= "point_transaction"."earned"))
);
--> statement-breakpoint
CREATE INDEX "customer_idx" ON "point_transaction" USING btree ("customer_id") WHERE ("point_transaction"."removed_at" is null or "point_transaction"."available" > 0);--> statement-breakpoint
CREATE INDEX "order_idx" ON "point_transaction" USING btree ("order_id") WHERE ("point_transaction"."removed_at" is null or "point_transaction"."available" > 0);--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "point_transaction" USING btree ("created_at") WHERE ("point_transaction"."removed_at" is null or "point_transaction"."available" > 0);