import { RolePermissionSeed } from '@common/constants';
import { AccountStatus, PermissionName, RoleName } from '@common/enums';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import { Branch } from '@shared/db/entities/branch.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { Permission } from '@shared/db/entities/permission.entity';
import { RolePermission } from '@shared/db/entities/role-permission.entity';
import { Role } from '@shared/db/entities/role.entity';
import { Room } from '@shared/db/entities/room.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import * as bcrypt from 'bcryptjs';
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
    private branchRepo: Repository<Branch>,

    @InjectRepository(Room)
    private roomRepo: Repository<Room>,

    @InjectRepository(TypeSeat)
    private typeSeatRepo: Repository<TypeSeat>,

    @InjectRepository(Seat)
    private seatRepo: Repository<Seat>,

    @InjectRepository(ShowTime)
    private showTimeRepo: Repository<ShowTime>,

    @InjectRepository(Movie)
    private movieRepo: Repository<Movie>
  ) {}

  async seed() {
    this.logger.log('Starting seeding process...');
    // this.seedRoles(),
    // this.seedPermissions(),
    // this.seedAccounts(),
    // this.seedAccountRoles(),
    // this.seedRolePermissions(),
    // this.seedBranches(),
    // await this.seedRooms();
    // await this.seedTypeSeats();
    await this.seedSeats();
    // await this.seedShowTimes();
  }
  private async seedRooms() {
    this.logger.log('Seeding rooms...');
    const branches = await this.branchRepo.find();
    const roomsToSeed = [];
    for (const branch of branches) {
      for (let i = 1; i <= 8; i++) {
        roomsToSeed.push({ name: `Room ${i}`, branchId: branch.id });
      }
    }
    await this.roomRepo.upsert(roomsToSeed, {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ['name', 'branchId']
    });
    this.logger.log('Seeding rooms completed.');
  }

  private async seedTypeSeats() {
    this.logger.log('Seeding type seats...');
    const typeSeatsToSeed = [
      { name: 'Standard', price: 80000, is_current: true },
      { name: 'VIP', price: 130000, is_current: true },
      { name: 'Couple', price: 160000, is_current: true },
      { name: 'Deluxe', price: 200000, is_current: true }
    ];
    await this.typeSeatRepo.upsert(typeSeatsToSeed, {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ['name']
    });
    this.logger.log('Seeding type seats completed.');
  }

  private async seedSeats() {
    this.logger.log('Seeding seats with fully randomized layouts...');
    const rooms = await this.roomRepo.find();

    const typeSeats = await this.typeSeatRepo.find();
    const typeSeatMap = typeSeats.reduce(
      (map, type) => {
        map[type.name.toUpperCase()] = type;
        return map;
      },
      {} as Record<string, TypeSeat>
    );

    if (!typeSeatMap.STANDARD || !typeSeatMap.VIP || !typeSeatMap.COUPLE) {
      this.logger.error(
        'Required seat types (Standard, VIP, Couple) not found. Aborting seat seeding.'
      );
      return;
    }

    const seatsToSeed = [];
    const allPossibleRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    for (const room of rooms) {
      // 1. Random số lượng hàng cho mỗi phòng (ví dụ từ 8-10 hàng)
      const numberOfRowsInRoom = Math.floor(Math.random() * 3) + 8;

      // 2. Random chọn ra các hàng sẽ có trong phòng này
      const roomRows = [...allPossibleRows]
        .sort(() => 0.5 - Math.random())
        .slice(0, numberOfRowsInRoom)
        .sort();

      const lastRow = roomRows[roomRows.length - 1];
      const vipRows = roomRows.slice(-3, -1); // 2 hàng gần cuối là VIP

      for (const row of roomRows) {
        // 3. Random số lượng ghế cho mỗi hàng (tối đa 12)
        const seatCountInThisRow = Math.floor(Math.random() * 5) + 8; // 8-12 ghế

        // HÀNG GHẾ ĐÔI (Hàng cuối)
        if (row === lastRow) {
          let i = 1;
          // Số lượng ghế đôi cũng ngẫu nhiên
          while (i < seatCountInThisRow) {
            seatsToSeed.push({
              roomId: room.id,
              typeSeatId: typeSeatMap.COUPLE.id,
              name: `${row}${i}`
            });
            i += 2; // Bước nhảy 2 cho ghế đôi
          }
        }
        // CÁC HÀNG GHẾ KHÁC
        else {
          for (let i = 1; i <= seatCountInThisRow; i++) {
            let typeSeat = typeSeatMap.STANDARD;
            if (vipRows.includes(row)) {
              typeSeat = typeSeatMap.VIP;
            }

            seatsToSeed.push({
              roomId: room.id,
              typeSeatId: typeSeat.id,
              name: `${row}${i}`
            });
          }
        }
      }
    }

    await this.seatRepo.upsert(seatsToSeed, {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ['roomId', 'name']
    });
    this.logger.log('Seeding seats completed.');
  }

  private async seedShowTimes() {
    this.logger.log('🎬 Seeding show_times...');

    const movies = await this.movieRepo.find();
    const rooms = await this.roomRepo.find();

    const MAX_SHOWTIMES = 14000;
    const HOURS_BETWEEN_SHOWS = 3;
    const START_HOUR = 8;
    const END_HOUR = 22;

    const showTimes: any[] = [];

    // Đảm bảo mỗi phòng có ít nhất 1 suất chiếu
    for (const room of rooms) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      if (!randomMovie.screeningStart || !randomMovie.screeningEnd) continue;

      const startDate = new Date(randomMovie.screeningStart);
      const timeStart = new Date(startDate);
      timeStart.setHours(START_HOUR, 0, 0, 0);

      showTimes.push({
        movieId: randomMovie.id,
        roomId: room.id,
        timeStart,
        showDate: new Date(timeStart)
      });
    }

    // Sinh thêm các suất ngẫu nhiên cho đến khi đạt tối đa 1500
    while (showTimes.length < MAX_SHOWTIMES) {
      const movie = movies[Math.floor(Math.random() * movies.length)];
      if (!movie.screeningStart || !movie.screeningEnd) continue;

      const room = rooms[Math.floor(Math.random() * rooms.length)];

      const startDate = new Date(movie.screeningStart);
      const endDate = new Date(movie.screeningEnd);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const randomDayOffset = Math.floor(Math.random() * diffDays);
      const showDate = new Date(startDate);
      showDate.setDate(showDate.getDate() + randomDayOffset);

      const randomHour =
        START_HOUR +
        HOURS_BETWEEN_SHOWS *
          Math.floor(Math.random() * ((END_HOUR - START_HOUR) / HOURS_BETWEEN_SHOWS));
      const timeStart = new Date(showDate);
      timeStart.setHours(randomHour, 0, 0, 0);

      showTimes.push({
        movieId: movie.id,
        roomId: room.id,
        timeStart,
        showDate
      });
    }

    await this.showTimeRepo.upsert(showTimes, {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ['movieId', 'roomId', 'timeStart', 'showDate']
    });

    this.logger.log(`✅ Seeding completed. Total show_times inserted: ${showTimes.length}`);
  }

  private async seedBranches() {
    this.logger.log('Seeding branches...');
    try {
      const branchesToSeed = [
        { name: 'CGV Vincom Center', address: '191 3/2 Street, District 10, Ho Chi Minh City' },
        { name: 'Lotte Cinema Go Vap', address: '242 Nguyen Van Luong, Go Vap, Ho Chi Minh City' },
        { name: 'Galaxy Nguyen Du', address: '116 Nguyen Du, District 1, Ho Chi Minh City' },
        { name: 'CoopMart Hanoi', address: '75 Thanh Xuan, Hanoi' },
        { name: 'Beta Cineplex Thai Nguyen', address: '66 Luong Ngoc Quyen, Thai Nguyen' },
        { name: 'CGV Da Nang', address: '478 2/9 Street, Hai Chau, Da Nang' },
        { name: 'Lotte Cinema Can Tho', address: '1 Hoa Binh Avenue, Ninh Kieu, Can Tho' },
        { name: 'Cinestar Hue', address: '25 Hung Vuong, Hue City' },
        { name: 'Mega GS Dong Nai', address: '82 Le Hong Phong, Bien Hoa City, Dong Nai' }
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
