import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn
} from 'typeorm';

export class BaseEntityTime {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export class BaseAuditedEntity extends BaseEntityTime {
  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById: string;
}
