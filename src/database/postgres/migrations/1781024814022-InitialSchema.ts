import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781024814022 implements MigrationInterface {
  name = 'InitialSchema1781024814022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "alignments" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                CONSTRAINT "UQ_1459e5eded493891b60d870b144" UNIQUE ("name"),
                CONSTRAINT "PK_791b0e88f94a57e804ffe4fda4a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "publishers" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                CONSTRAINT "UQ_39082806f986a63cd7dcf1782a5" UNIQUE ("name"),
                CONSTRAINT "PK_9d73f23749dca512efc3ccbea6a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."heroes_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')
        `);
    await queryRunner.query(`
            CREATE TABLE "heroes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "status" "public"."heroes_status_enum" NOT NULL DEFAULT 'DRAFT',
                "publisher_id" integer,
                "alignment_id" integer,
                "full_name" character varying(255),
                "height_cm" integer,
                "weight_kg" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_9db096e6a3c6fe87c82c0af18fc" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "attributes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "hero_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "value" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_4e2e801ef3f36ee6c802a89f6e0" UNIQUE ("hero_id", "name"),
                CONSTRAINT "PK_32216e2e61830211d3a5d7fa72c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'EDITOR', 'VIEWER')
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cpf" character varying(11) NOT NULL,
                "name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'VIEWER',
                "bio" text,
                "photo_url" character varying(255),
                "phone" character varying(20),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_230b925048540454c8b4c481e1c" UNIQUE ("cpf"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "revoked_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "jti" character varying(255) NOT NULL,
                "user_id" uuid NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "revoked_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_b18aa48269f87cafba8c6310624" UNIQUE ("jti"),
                CONSTRAINT "PK_5c2b3ed5a8f0e4972e358985038" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "powers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "hero_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "value" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_f1e25f50f2af8478ff09318b24a" UNIQUE ("hero_id", "name"),
                CONSTRAINT "PK_5975f98852baf545611a53c0996" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "heroes"
            ADD CONSTRAINT "FK_2865df5ead1fb8f768a342676fd" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "heroes"
            ADD CONSTRAINT "FK_febd0a5e4eac8e0b9c7cf6315d3" FOREIGN KEY ("alignment_id") REFERENCES "alignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "attributes"
            ADD CONSTRAINT "FK_74abf75e6d975ab24659cc6b7c3" FOREIGN KEY ("hero_id") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "revoked_tokens"
            ADD CONSTRAINT "FK_483872b2fdc8f1ec750c9c7567c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "powers"
            ADD CONSTRAINT "FK_aa54dbe60691f3d57a36c7edd73" FOREIGN KEY ("hero_id") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "powers" DROP CONSTRAINT "FK_aa54dbe60691f3d57a36c7edd73"
        `);
    await queryRunner.query(`
            ALTER TABLE "revoked_tokens" DROP CONSTRAINT "FK_483872b2fdc8f1ec750c9c7567c"
        `);
    await queryRunner.query(`
            ALTER TABLE "attributes" DROP CONSTRAINT "FK_74abf75e6d975ab24659cc6b7c3"
        `);
    await queryRunner.query(`
            ALTER TABLE "heroes" DROP CONSTRAINT "FK_febd0a5e4eac8e0b9c7cf6315d3"
        `);
    await queryRunner.query(`
            ALTER TABLE "heroes" DROP CONSTRAINT "FK_2865df5ead1fb8f768a342676fd"
        `);
    await queryRunner.query(`
            DROP TABLE "powers"
        `);
    await queryRunner.query(`
            DROP TABLE "revoked_tokens"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "attributes"
        `);
    await queryRunner.query(`
            DROP TABLE "heroes"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."heroes_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "publishers"
        `);
    await queryRunner.query(`
            DROP TABLE "alignments"
        `);
  }
}
