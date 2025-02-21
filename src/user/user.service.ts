import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.entity';
import { Transaction, Op, Sequelize, FindOptions } from 'sequelize';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
  ) {}

  async createUser(
    name: string,
    email: string,
    transaction?: Transaction,
  ): Promise<User> {
    if (!name || !email) {
      throw new Error('Name and email are required');
    }
    return this.userModel.create({ name, email }, { transaction });
  }

  async createMultipleUsers(
    users: Array<{ name: string; email: string }>,
  ): Promise<User[]> {
    return this.sequelize.transaction(async (t) => {
      const createdUsers = await Promise.all(
        users.map((user) => this.createUser(user.name, user.email, t)),
      );
      return createdUsers;
    });
  }

  async getUsers(options?: FindOptions): Promise<User[]> {
    return this.userModel.findAll(options);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${query}%`,
            },
          },
          {
            email: {
              [Op.iLike]: `%${query}%`,
            },
          },
        ],
      },
    });
  }

  async getUsersByLoginCount(minCount: number): Promise<User[]> {
    return this.userModel.findAll({
      where: {
        loginCount: {
          [Op.gte]: minCount,
        },
      },
      order: [['loginCount', 'DESC']],
    });
  }

  async incrementLoginCount(userId: string): Promise<void> {
    await this.userModel.increment('loginCount', {
      where: { id: userId },
    });
  }

  async executeRawQuery(): Promise<any> {
    return this.sequelize.query(
      `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_users
      FROM "Users"
      `,
      {
        type: 'SELECT',
      },
    );
  }
}
