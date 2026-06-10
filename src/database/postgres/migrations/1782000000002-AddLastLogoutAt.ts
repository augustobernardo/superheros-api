import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLogoutAt1782000000002 implements MigrationInterface {
  name = 'AddLastLogoutAt1782000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'last_logout_at'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "last_logout_at" TIMESTAMP NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "last_logout_at"
    `);
  }
}
