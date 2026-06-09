import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLogoutAt1782000000002 implements MigrationInterface {
  name = 'AddLastLogoutAt1782000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "last_logout_at" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "last_logout_at"
    `);
  }
}
