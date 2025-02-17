import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

import { User } from '../user/user.entity';
import { Product } from '../products/product.entity';
import { Book } from '../books/entities/book.entity';

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
            models: [User, Product, Book],
            autoLoadModels: true, // No need to register models manually
            dialectOptions: {
              useUTC: false,
            },
          };
        } else {
          return {
            dialect: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USER'),
            password: configService.get('DB_PASS'),
            database: configService.get('DB_NAME'),
            models: [User, Product, Book], // Add all models here
            autoLoadModels: true, // No need to register models manually
            synchronize: isTestEnv, // Sync in test env but not in prod
            logging: !isTestEnv,
          };
        }
      },
    }),
    SequelizeModule.forFeature([User, Product]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
