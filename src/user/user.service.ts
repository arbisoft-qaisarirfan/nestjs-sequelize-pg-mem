import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async createUser(name: string, email: string): Promise<User> {
    return this.userModel.create({ name, email });
  }

  async getUsers(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }
}
