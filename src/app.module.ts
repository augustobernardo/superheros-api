import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { BattlesModule } from './battles/battles.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HeroesModule } from './heroes/heroes.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggingModule } from './logging/logging.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PowersModule } from './powers/powers.module';
import { ReportsModule } from './reports/reports.module';
import { RolesGuard } from './common/guards/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { getMongooseConfig } from './database/mongo/mongoose.config';
import { getTypeOrmConfig } from './database/postgres/typeorm.config';
import { validationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMongooseConfig,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    LoggingModule,
    AuthModule,
    UsersModule,
    HeroesModule,
    AttributesModule,
    PowersModule,
    ReportsModule,
    BattlesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
