import { faker } from '@faker-js/faker';
import { UserService } from './user.service';
import {
  cleanupTest,
  createAppFrom,
  createTestingModule,
  usersMigration,
} from '../../test/test-utils';
import { INestApplication } from '@nestjs/common';
import { User } from './user.entity';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { UserController } from './user.controller';

interface UserStats {
  total_users: string;
  active_users: string;
}

describe('Enhanced User Module Tests', () => {
  let userService: UserService;
  let userController: UserController;
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeEach(async () => {
    const module = createTestingModule();
    app = await createAppFrom(module, true);
    userService = app.get<UserService>(UserService);
    userController = app.get<UserController>(UserController);
    sequelize = await app.resolve(getConnectionToken());
    await usersMigration(sequelize.getQueryInterface());
  });

  afterEach(async () => {
    await cleanupTest(app);
  });

  describe('UserService', () => {
    describe('createUser', () => {
      it('should create a user with valid data', async () => {
        const userData = {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        };
        const user = await userService.createUser(
          userData.name,
          userData.email,
        );
        expect(user.id).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
      });

      it('should not create a user with duplicate email', async () => {
        const email = faker.internet.email();
        await userService.createUser(faker.person.fullName(), email);
        await expect(
          userService.createUser(faker.person.fullName(), email),
        ).rejects.toThrow();
      });

      it('should create users with different emails', async () => {
        const user1 = await userService.createUser(
          faker.person.fullName(),
          faker.internet.email(),
        );
        const user2 = await userService.createUser(
          faker.person.fullName(),
          faker.internet.email(),
        );
        expect(user1.id).not.toBe(user2.id);
      });

      it('should not create a user with empty name', async () => {
        await expect(
          userService.createUser('', faker.internet.email()),
        ).rejects.toThrow();
      });

      it('should not create a user with empty email', async () => {
        await expect(
          userService.createUser(faker.person.fullName(), ''),
        ).rejects.toThrow();
      });
    });

    describe('getUsers', () => {
      it('should return empty array when no users exist', async () => {
        const users = await userService.getUsers();
        expect(users).toEqual([]);
      });

      it('should return all created users', async () => {
        const usersToCreate = 3 + 2;
        for (let i = 0; i < usersToCreate; i++) {
          await userService.createUser(
            faker.person.fullName(),
            faker.internet.email(),
          );
        }
        const users = await userService.getUsers();
        expect(users).toHaveLength(usersToCreate);
      });

      it('should return users with correct properties', async () => {
        const userData = {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        };
        await userService.createUser(userData.name, userData.email);
        const users = await userService.getUsers();
        expect(users[0]).toHaveProperty('id');
        expect(users[0]).toHaveProperty('name', userData.name);
        expect(users[0]).toHaveProperty('email', userData.email);
      });
    });

    describe('getUserByEmail', () => {
      it('should find existing user by email', async () => {
        const userData = {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        };
        await userService.createUser(userData.name, userData.email);
        const user = await userService.getUserByEmail(userData.email);
        expect(user?.email).toBe(userData.email);
      });

      it('should return null for non-existent email', async () => {
        const user = await userService.getUserByEmail(faker.internet.email());
        expect(user).toBeNull();
      });

      it('should return correct user when multiple users exist', async () => {
        const targetEmail = faker.internet.email();
        const targetName = faker.person.fullName();

        // Create multiple users
        await userService.createUser(
          faker.person.fullName(),
          faker.internet.email(),
        );
        await userService.createUser(targetName, targetEmail);
        await userService.createUser(
          faker.person.fullName(),
          faker.internet.email(),
        );

        const user = await userService.getUserByEmail(targetEmail);
        expect(user?.name).toBe(targetName);
      });
    });
  });

  describe('UserController', () => {
    describe('createUser', () => {
      it('should create user through controller', async () => {
        const userData = {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        };
        const user = await userController.createUser(userData);
        expect(user?.name).toBe(userData.name);
        expect(user?.email).toBe(userData.email);
      });

      it('should handle duplicate email error in controller', async () => {
        const email = faker.internet.email();
        await userController.createUser({
          name: faker.person.fullName(),
          email,
        });
        await expect(
          userController.createUser({ name: faker.person.fullName(), email }),
        ).rejects.toThrow();
      });
    });

    describe('getUsers', () => {
      it('should return users through controller', async () => {
        const userData = {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        };
        await userController.createUser(userData);
        const users = await userController.getUsers();
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe(userData.email);
      });

      it('should return empty array when no users exist (controller)', async () => {
        const users = await userController.getUsers();
        expect(users).toEqual([]);
      });
    });
  });

  describe('User Entity', () => {
    it('should have correct model structure', () => {
      const user = new User();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', async () => {
      const longName = 'a'.repeat(255);
      const user = await userService.createUser(
        longName,
        faker.internet.email(),
      );
      expect(user.name).toBe(longName);
    });

    it('should handle special characters in email', async () => {
      const email = 'test.user+special@example.com';
      const user = await userService.createUser(faker.person.fullName(), email);
      expect(user.email).toBe(email);
    });

    it('should handle names with special characters', async () => {
      const name = "José María O'Connor-Smith";
      const user = await userService.createUser(name, faker.internet.email());
      expect(user.name).toBe(name);
    });

    it('should handle concurrent user creation', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() =>
          userService.createUser(
            faker.person.fullName(),
            faker.internet.email(),
          ),
        );
      const users = await Promise.all(promises);
      expect(users).toHaveLength(5);
      const ids = users.map((user) => user.id);
      expect(new Set(ids).size).toBe(5); // All IDs should be unique
    });
  });

  describe('Transaction Tests', () => {
    it('should create multiple users in a transaction', async () => {
      const usersData = Array(3)
        .fill(null)
        .map(() => ({
          name: faker.person.fullName(),
          email: faker.internet.email(),
        }));

      const users = await userService.createMultipleUsers(usersData);
      expect(users).toHaveLength(3);
      expect(users[0].id).toBeDefined();
    });

    it('should rollback transaction on error', async () => {
      const usersData = [
        { name: faker.person.fullName(), email: faker.internet.email() },
        { name: faker.person.fullName(), email: faker.internet.email() },
        { name: '', email: '' }, // Invalid user data to trigger rollback
      ];

      await expect(
        userService.createMultipleUsers(usersData),
      ).rejects.toThrow();
      const users = await userService.getUsers();
      expect(users).toHaveLength(0); // Transaction should have rolled back
    });
  });

  describe('Operator Tests', () => {
    beforeEach(async () => {
      // Create test users
      await userService.createUser('Test User', 'test@example.com');
      await userService.createUser('Another User', 'another@example.com');
      await userService.createUser('Final User', 'final@example.com');
    });

    it('should search users using iLike operator', async () => {
      const users = await userService.searchUsers('test');
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('test@example.com');
    });

    it('should find users by login count using gte operator', async () => {
      await userService.incrementLoginCount(
        (await userService.getUserByEmail('test@example.com'))?.id ?? '',
      );
      await userService.incrementLoginCount(
        (await userService.getUserByEmail('test@example.com'))?.id ?? '',
      );

      const users = await userService.getUsersByLoginCount(2);
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('test@example.com');
    });
  });

  describe('Raw Query Tests', () => {
    it('should return correct user statistics', async () => {
      // Create active users
      await User.bulkCreate([
        {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          isActive: true,
        },
        {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          isActive: true,
        },
      ]);

      // Create inactive user
      await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        isActive: false,
      });

      const results = (await userService.executeRawQuery()) as UserStats[];

      expect(results).toHaveLength(1);
      expect(results[0].total_users).toBe(3);
      expect(results[0].active_users).toBe(2);
    });

    it('should handle empty table', async () => {
      const results = (await userService.executeRawQuery()) as UserStats[];

      expect(results).toHaveLength(1);
      expect(results[0].total_users).toBe(0);
      expect(results[0].active_users).toBe(null);
    });

    it('should handle large number of users', async () => {
      const usersToCreate = Array(10)
        .fill(null)
        .map(() => ({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          isActive: Math.random() > 0.5, // randomly set active status
        }));

      await User.bulkCreate(usersToCreate);

      const results = (await userService.executeRawQuery()) as UserStats[];
      const activeCount = usersToCreate.filter((u) => u.isActive).length;

      expect(results).toHaveLength(1);
      expect(results[0].total_users).toBe(usersToCreate.length);
      expect(results[0].active_users).toBe(activeCount);
    });
  });

  describe('UUID Tests', () => {
    it('should generate UUID for new users', async () => {
      const user = await userService.createUser(
        faker.person.fullName(),
        faker.internet.email(),
      );
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});
