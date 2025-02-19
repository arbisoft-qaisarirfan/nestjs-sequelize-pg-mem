import { AppController } from './app.controller';

import {
  cleanupTest,
  createAppFrom,
  createTestingModule,
} from '../test/test-utils';
import { INestApplication } from '@nestjs/common';

describe('AppController', () => {
  let app: INestApplication;
  let appController: AppController;

  beforeEach(async () => {
    const module = createTestingModule();

    app = await createAppFrom(module, true);
    appController = app.get<AppController>(AppController);
  });

  afterEach(async () => {
    await cleanupTest(app);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
