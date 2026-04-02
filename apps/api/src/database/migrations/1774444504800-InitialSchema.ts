import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774444504800 implements MigrationInterface {
    name = 'InitialSchema1774444504800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."schedules_status_enum" AS ENUM('open', 'full', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "departure_time" TIME NOT NULL, "capacity" integer NOT NULL, "available_slots" integer NOT NULL, "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'open', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "activity_id" uuid NOT NULL, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."activities_category_enum" AS ENUM('boat_tour', 'parasailing', 'jeep_safari', 'diving', 'other')`);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "short_description" text, "description" text, "category" "public"."activities_category_enum" NOT NULL, "duration_minutes" integer NOT NULL, "min_age" integer, "max_capacity" integer NOT NULL, "price_adult" numeric(10,2) NOT NULL, "price_child" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'TRY', "images" jsonb, "includes" jsonb, "excludes" jsonb, "meeting_point" text, "what_to_bring" text, "cancellation_policy" text, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c9ee662a4db2641eeac1bd33587" UNIQUE ("slug"), CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c9ee662a4db2641eeac1bd3358" ON "activities" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_payment_method_enum" AS ENUM('credit_card', 'bank_transfer')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_reference" character varying NOT NULL, "customer_name" character varying NOT NULL, "customer_email" character varying NOT NULL, "customer_phone" character varying NOT NULL, "adult_count" integer NOT NULL, "child_count" integer NOT NULL, "total_amount" numeric(10,2) NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "payment_method" "public"."bookings_payment_method_enum" NOT NULL, "special_requests" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "schedule_id" uuid NOT NULL, "activity_id" uuid NOT NULL, CONSTRAINT "UQ_5ba137683172608bf22d69538a0" UNIQUE ("booking_reference"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'staff', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "phone" character varying, "password_hash" character varying NOT NULL, "full_name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "is_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticket_number" character varying NOT NULL, "qr_code_data" text NOT NULL, "qr_code_url" text, "pdf_url" text, "is_used" boolean NOT NULL DEFAULT false, "used_at" TIMESTAMP, "valid_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" uuid NOT NULL, CONSTRAINT "UQ_8d7b9a157280caf57aa0282e72c" UNIQUE ("ticket_number"), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("key" character varying NOT NULL, "value" jsonb NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_c8639b7626fa94ba8265628f214" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('credit_card', 'bank_transfer')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL, "provider" character varying NOT NULL, "provider_transaction_id" character varying, "provider_response" jsonb, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" uuid NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_type_enum" AS ENUM('sms', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('sent', 'failed', 'pending')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_logs_type_enum" NOT NULL, "recipient" character varying NOT NULL, "template" character varying NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL, "provider_response" jsonb, "sent_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" uuid NOT NULL, CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."einvoices_status_enum" AS ENUM('draft', 'sent', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "einvoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_number" character varying NOT NULL, "status" "public"."einvoices_status_enum" NOT NULL DEFAULT 'draft', "provider_response" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" uuid NOT NULL, CONSTRAINT "PK_c0101a9c3f1628a8f335c05960a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bank_transfer_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_name" character varying NOT NULL, "iban" character varying NOT NULL, "account_holder" character varying NOT NULL, "transfer_reference" character varying NOT NULL, "confirmed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" uuid NOT NULL, "confirmed_by" uuid, CONSTRAINT "REL_b169114629c8401d5f49901be2" UNIQUE ("booking_id"), CONSTRAINT "PK_77889e8bb30650f7ba7917f1a42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_5538141cf50d22688a3fc0ebb92" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_c752b8edf0efcd91adf6ec45d40" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_9a8da83eb74b4ced2d34c562aa3" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_cc20985f14524969dddd128efd5" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_logs" ADD CONSTRAINT "FK_1223ae7c29bd593629eee411d09" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "einvoices" ADD CONSTRAINT "FK_bb3f4f9aa5f9f6fd144e76cd76e" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_transfer_info" ADD CONSTRAINT "FK_b169114629c8401d5f49901be2e" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_transfer_info" ADD CONSTRAINT "FK_e97561048e5f1464a5affca0fc5" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_transfer_info" DROP CONSTRAINT "FK_e97561048e5f1464a5affca0fc5"`);
        await queryRunner.query(`ALTER TABLE "bank_transfer_info" DROP CONSTRAINT "FK_b169114629c8401d5f49901be2e"`);
        await queryRunner.query(`ALTER TABLE "einvoices" DROP CONSTRAINT "FK_bb3f4f9aa5f9f6fd144e76cd76e"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DROP CONSTRAINT "FK_1223ae7c29bd593629eee411d09"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_cc20985f14524969dddd128efd5"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_9a8da83eb74b4ced2d34c562aa3"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_c752b8edf0efcd91adf6ec45d40"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_5538141cf50d22688a3fc0ebb92"`);
        await queryRunner.query(`DROP TABLE "bank_transfer_info"`);
        await queryRunner.query(`DROP TABLE "einvoices"`);
        await queryRunner.query(`DROP TYPE "public"."einvoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_type_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9ee662a4db2641eeac1bd3358"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP TYPE "public"."activities_category_enum"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_status_enum"`);
    }

}
