import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

import { User } from '../user/user.entity';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTestEnv = configService.get<string>('NODE_ENV') === 'test';

        if (isTestEnv) {
          return {
            dialect: 'postgres',
            storage: ':memory:',
            models: [User],
            autoLoadModels: true, // No need to register models manually
          };
        } else {
          return {
            dialect: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            models: [User], // Add all models here
            autoLoadModels: true, // No need to register models manually
            synchronize: isTestEnv, // Sync in test env but not in prod
            logging: !isTestEnv,
          };
        }
      },
    }),
    SequelizeModule.forFeature([User]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
