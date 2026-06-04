import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// this file is used exclusively by TypeORM CLI commands
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/postgres/migrations/*{.ts,.js}'],
  synchronize: false,
});
