import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../user/user.entity';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
      models: [User],
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
