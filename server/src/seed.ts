import 'reflect-metadata';
import * as argon2 from 'argon2';
import configuration from './config/configuration';
import dataSource from './config/typeorm-cli.config';
import { UserRole } from './database/enums';
import { User } from './database/user.entity';

async function seed() {
  const config = configuration();
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const email = config.seed.adminEmail.toLowerCase();
  const existing = await users.findOne({ where: { email } });

  if (existing) {
    await dataSource.destroy();
    return;
  }

  await users.save(
    users.create({
      email,
      passwordHash: await argon2.hash(config.seed.adminPassword, {
        type: argon2.argon2id,
      }),
      firstName: config.seed.adminFirstName,
      lastName: config.seed.adminLastName,
      role: UserRole.ADMIN,
      isActive: true,
    }),
  );

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});

