import { SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from './user.entity';
import { UserService } from './user.service';
import { DataType, newDb } from 'pg-mem';
import { Sequelize } from 'sequelize-typescript';
import { faker } from '@faker-js/faker';

describe('UserService (Unit)', () => {
  let userService: UserService;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'now',
      returns: DataType.timetz,
      implementation: () => new Date(),
    });
    sequelize = new Sequelize({
      dialect: 'postgres',
      dialectModule: db.adapters.createPg(),
      logging: false,
    });

    sequelize.addModels([User]);
    await sequelize.sync({ force: true });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'postgres',
          storage: ':memory:',
          models: [User],
        }),
        SequelizeModule.forFeature([User]),
      ],
      providers: [UserService],
    })
      .overrideProvider(Sequelize)
      .useValue(sequelize)
      .compile();

    userService = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a user', async () => {
    const name = faker.person.fullName();
    const user = await userService.createUser(name, faker.internet.email());
    expect(user.id).toBeDefined();
    expect(user.name).toBe(name);
  });

  it('should retrieve all users', async () => {
    await userService.createUser(
      faker.person.fullName(),
      faker.internet.email(),
    );
    const users = await userService.getUsers();
    expect(users.length).toBeGreaterThan(0);
  });

  it('should find a user by email', async () => {
    const email = faker.internet.email();
    const name = faker.person.fullName();
    await userService.createUser(name, email);
    const user = await userService.getUserByEmail(email);
    expect(user).toBeDefined();
    expect(user?.name).toBe(name);
  });
});
