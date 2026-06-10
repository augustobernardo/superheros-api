import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { UserRole } from '../../../users/enums/user-role.enum';

export async function runUserSeed(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { cpf: '00000000000' },
    withDeleted: true,
  });

  if (existingAdmin) {
    if (existingAdmin.deletedAt) {
      await userRepository.restore(existingAdmin.id);
      console.log('♻️  Admin user restored (was soft-deleted)');
    } else {
      console.log('⏭️  Admin user already exists');
    }
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = userRepository.create({
    cpf: '00000000000',
    name: 'Administrator',
    email: 'admin@superheros.com',
    passwordHash,
    role: UserRole.ADMIN,
  });

  await userRepository.save(admin);
  console.log('✅ Admin user created (cpf: 00000000000, password: Admin@123)');
}
