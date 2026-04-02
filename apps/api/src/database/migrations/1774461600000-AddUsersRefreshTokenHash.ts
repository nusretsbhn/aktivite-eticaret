import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersRefreshTokenHash1774461600000 implements MigrationInterface {
  name = 'AddUsersRefreshTokenHash1774461600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token_hash" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token_hash"`);
  }
}

