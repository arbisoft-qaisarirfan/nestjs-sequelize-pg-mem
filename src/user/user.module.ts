import { Module } from '@nestjs/common';
import { getConnectionToken, SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'SEQUELIZE',
      useExisting: getConnectionToken(),
    },
  ],
  exports: [UserService],
})
export class UserModule {}
