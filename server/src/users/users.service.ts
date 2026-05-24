import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { PaginationMeta, toPaginatedResult } from '../common/interfaces/paginated-result.interface';
import { throwConflictForUniqueViolation } from '../common/utils/database-errors';
import { PublicUser, toPublicUser } from '../common/utils/entity-response';
import { UserRole } from '../database/enums';
import { User } from '../database/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

export type PaginatedUsers = {
  data: PublicUser[];
  meta: PaginationMeta;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash: await this.hashSecret(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? UserRole.PATIENT,
      isActive: dto.isActive ?? true,
    });

    try {
      return toPublicUser(await this.usersRepository.save(user));
    } catch (error) {
      throwConflictForUniqueViolation(error, 'A user with this email already exists');
    }
  }

  async list(query: UserQueryDto): Promise<PaginatedUsers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive === 'true' });
    }

    const sortBy = ['email', 'firstName', 'lastName', 'role', 'createdAt'].includes(query.sortBy ?? '')
      ? query.sortBy
      : 'createdAt';
    qb.orderBy(`user.${sortBy}`, (query.sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();
    const result = toPaginatedResult(users.map(toPublicUser), total, page, limit);
    return result;
  }

  async findById(id: string): Promise<PublicUser> {
    return toPublicUser(await this.findEntityById(id));
  }

  async findEntityById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string, includeSecrets = false): Promise<User | null> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() });

    if (includeSecrets) {
      qb.addSelect(['user.passwordHash', 'user.refreshTokenHash', 'user.refreshTokenId']);
    }

    return qb.getOne();
  }

  async findByIdWithSecrets(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.refreshTokenHash', 'user.refreshTokenId'])
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.findEntityById(id);

    if (dto.email !== undefined) {
      user.email = dto.email.toLowerCase();
    }
    if (dto.password !== undefined) {
      user.passwordHash = await this.hashSecret(dto.password);
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    try {
      return toPublicUser(await this.usersRepository.save(user));
    } catch (error) {
      throwConflictForUniqueViolation(error, 'A user with this email already exists');
    }
  }

  async setRefreshToken(userId: string, refreshTokenId: string, refreshToken: string): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshTokenId,
      refreshTokenHash: await this.hashSecret(refreshToken),
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshTokenId: null,
      refreshTokenHash: null,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findEntityById(id);
    if (user.role === UserRole.ADMIN) {
      const activeAdmins = await this.usersRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      if (activeAdmins <= 1) {
        throw new ConflictException('At least one active admin must remain');
      }
    }

    await this.usersRepository.softDelete(id);
  }

  verifySecret(hash: string, secret: string): Promise<boolean> {
    return argon2.verify(hash, secret);
  }

  hashSecret(secret: string): Promise<string> {
    return argon2.hash(secret, {
      type: argon2.argon2id,
    });
  }
}

