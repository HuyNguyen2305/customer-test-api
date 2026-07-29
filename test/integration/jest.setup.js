import { afterAll } from '@jest/globals';
import { sequelize } from '#models/index.js';

afterAll(async () => {
  await sequelize.close();
});
