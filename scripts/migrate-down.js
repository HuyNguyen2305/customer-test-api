import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '#common/sequelize.js';

const umzug = new Umzug({
  migrations: { glob: 'migration/*.cjs' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

await umzug.down();
await sequelize.close();
