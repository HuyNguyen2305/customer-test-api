import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '#common/sequelize.js';

const umzug = new Umzug({
  migrations: { glob: 'migration/*.cjs' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

await umzug.up();
await sequelize.close();
