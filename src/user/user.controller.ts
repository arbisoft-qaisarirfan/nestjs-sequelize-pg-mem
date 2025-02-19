import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() body: { name: string; email: string },
  ): Promise<User> {
    return this.userService.createUser(body.name, body.email);
  }

  @Get()
  async getUsers(): Promise<User[]> {
    return this.userService.getUsers();
  }
}
