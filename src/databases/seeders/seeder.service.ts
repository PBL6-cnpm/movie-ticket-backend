import { RolePermissionSeed } from '@common/constants';
import { AccountStatus, PermissionName, RoleName } from '@common/enums';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import { Branch } from '@shared/db/entities/branch.entity';
import { Permission } from '@shared/db/entities/permission.entity';
import { RolePermission } from '@shared/db/entities/role-permission.entity';
import { Role } from '@shared/db/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,

    @InjectRepository(Account)
    private accountRepo: Repository<Account>,

    @InjectRepository(AccountRole)
    private accountRoleRepo: Repository<AccountRole>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>
  ) {}

  async seed() {
    this.logger.log('Starting seeding process...');
    await this.seedRoles();
    await this.seedPermissions();
    await this.seedBranches();
    await this.seedAccounts();
    await this.seedAccountRoles();
    await this.seedRolePermissions();
  }

  private async seedBranches() {
    this.logger.log('Seeding branches...');
    try {
      const branchesToSeed = [
        {
          name: 'CoopMart Hà Nội',
          address: '75 Thanh Xuân, Hà Nội'
        },
        {
          name: 'Lotte Cinema Gò Vấp',
          address: '242 Nguyễn Văn Lượng, Gò Vấp, TP.HCM'
        },
        {
          name: 'CGV Vincom',
          address: '191 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM'
        }
      ];

      await this.branchRepo.upsert(branchesToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name', 'address']
      });

      this.logger.log('Seeding branches completed.');
    } catch (error) {
      this.logger.error('Error seeding branches:', error);
    }
  }

  private async seedAccounts() {
    this.logger.log('Seeding accounts...');
    try {
      const rawAccounts = [
        {
          fullName: 'Super Admin',
          email: 'superadmin@example.com',
          password: 'SuperAdmin@123',
          status: AccountStatus.ACTIVE
        },
        {
          fullName: 'Admin User',
          email: 'admin@example.com',
          password: 'Admin@1234',
          status: AccountStatus.ACTIVE
        },
        {
          fullName: 'Staff User',
          email: 'staff@example.com',
          password: 'Staff@1234',
          status: AccountStatus.ACTIVE
        },
        {
          fullName: 'Customer User',
          email: 'customer@example.com',
          password: 'Customer@1234',
          status: AccountStatus.ACTIVE
        }
      ];
      const accountsToSeed = [];
      for (const acc of rawAccounts) {
        const hashedPassword = await bcrypt.hash(acc.password, 10);
        accountsToSeed.push({ ...acc, password: hashedPassword });
      }
      await this.accountRepo.upsert(accountsToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['email']
      });
      this.logger.log('Seeding accounts completed.');
    } catch (error) {
      this.logger.error('Error seeding accounts:', error);
    }
  }

  async seedAccountRoles() {
    this.logger.log('Seeding account roles...');
    try {
      const accounts = await this.accountRepo.find();
      const roles = await this.roleRepo.find();
      const mapping = [
        { email: 'superadmin@example.com', role: RoleName.SUPER_ADMIN },
        { email: 'admin@example.com', role: RoleName.ADMIN },
        { email: 'staff@example.com', role: RoleName.STAFF },
        { email: 'customer@example.com', role: RoleName.CUSTOMER }
      ];
      const accountRolesToSeed = mapping
        .map((m) => {
          const account = accounts.find((a) => a.email === m.email);
          const role = roles.find((r) => r.name === m.role);
          return account && role ? { accountId: account.id, roleId: role.id } : null;
        })
        .filter(Boolean);
      await this.accountRoleRepo.upsert(accountRolesToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['accountId', 'roleId']
      });
      this.logger.log('Seeding account roles completed.');
    } catch (error) {
      this.logger.error('Error seeding account roles:', error);
    }
  }
  private async seedRoles() {
    this.logger.log('Seeding roles...');
    try {
      const rolesToSeed = Object.values(RoleName).map((name) => ({
        name: name as RoleName
      }));

      await this.roleRepo.upsert(rolesToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name']
      });

      this.logger.log('Seeding roles completed.');
    } catch (error) {
      this.logger.error('Error seeding roles:', error);
    }
  }

  private async seedPermissions() {
    this.logger.log('Seeding permissions...');
    try {
      const permissionToSeed = Object.values(PermissionName).map((name) => ({
        name: name as PermissionName
      }));

      await this.permissionRepo.upsert(permissionToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name']
      });

      this.logger.log('Seeding permissions completed.');
    } catch (error) {
      this.logger.error('Error seeding permissions:', error);
    }
  }

  private async seedRolePermissions() {
    this.logger.log('Seeding role_permissions...');
    try {
      const roles = await this.roleRepo.find();
      const permissions = await this.permissionRepo.find();

      const rolePermEntities = [];

      for (const [roleName, permList] of Object.entries(RolePermissionSeed)) {
        const role = roles.find((r) => r.name === (roleName as RoleName));
        if (!role) continue;

        if (role.name === (RoleName.SUPER_ADMIN as RoleName)) {
          for (const permission of permissions) {
            rolePermEntities.push(
              this.rolePermissionRepo.create({
                role,
                permission
              })
            );
          }
          continue;
        }

        for (const perName of permList) {
          const permission = permissions.find((p) => p.name === perName);
          if (!permission) continue;

          rolePermEntities.push(
            this.rolePermissionRepo.create({
              role,
              permission
            })
          );
        }
      }

      await this.rolePermissionRepo.upsert(rolePermEntities, {
        conflictPaths: ['roleId', 'permissionId'],
        skipUpdateIfNoValuesChanged: true
      });

      this.logger.log('Seeding role_permission completed.');
    } catch (error) {
      this.logger.error('Error seeding role_permission: ', error);
    }
  }
}
