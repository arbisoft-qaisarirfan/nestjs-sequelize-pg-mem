import { SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from './user.entity';
import { UserService } from './user.service';
import { newDb } from 'pg-mem';
import { Sequelize } from 'sequelize-typescript';

describe('UserService (Unit)', () => {
  let userService: UserService;

  beforeAll(async () => {
    const db = newDb();
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
      dialectModule: db.adapters.createPg(),
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'postgres',
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_pass',
          models: [User],
        }),
        SequelizeModule.forFeature([User]),
      ],
      providers: [UserService],
    })
      .overrideProvider(SequelizeModule)
      .useValue(sequelize)
      .compile();

    userService = module.get<UserService>(UserService);
    await sequelize.sync();
  });

  it('should create a user', async () => {
    const user = await userService.createUser('John Doe', 'john@example.com');
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
  });

  it('should retrieve all users', async () => {
    await userService.createUser('Jane Doe', 'jane@example.com');
    const users = await userService.getUsers();
    expect(users.length).toBeGreaterThan(0);
  });

  it('should find a user by email', async () => {
    await userService.createUser('Alice', 'alice@example.com');
    const user = await userService.getUserByEmail('alice@example.com');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Alice');
  });
});
