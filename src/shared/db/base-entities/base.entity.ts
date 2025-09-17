import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn
} from 'typeorm';

export class BaseEntityTime {
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

export class BaseAuditedEntity extends BaseEntityTime {
  @Column({ name: 'created_by_id' })
  createdById: string;

  @Column({ name: 'updated_by_id' })
  updatedById: string;
}
