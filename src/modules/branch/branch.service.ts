import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { NotFound } from '@common/exceptions';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '@shared/db/entities/branch.entity';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService extends BaseService<Branch> {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>
  ) {
    super(branchRepo);
  }

  async createNewBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    // Check if branch with same name and address already exists
    const exists = await this.branchRepo.findOne({
      where: {
        name: createBranchDto.name,
        address: createBranchDto.address
      }
    });

    if (exists) {
      throw new ConflictException('Branch with this name and address already exists');
    }

    const branch = this.branchRepo.create(createBranchDto);
    return this.branchRepo.save(branch);
  }

  async getAllBranches(): Promise<Branch[]> {
    return this.findAll();
  }

  async getBranchById(id: string): Promise<Branch> {
    const branch = await this.findOneById(id);

    if (!branch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    return branch;
  }

  async updateBranch(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const existingBranch = await this.findOneById(id);

    if (!existingBranch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Check if another branch with same name and address exists (excluding current branch)
    if (updateBranchDto.name || updateBranchDto.address) {
      const checkExisting = await this.branchRepo.findOne({
        where: {
          name: updateBranchDto.name || existingBranch.name,
          address: updateBranchDto.address || existingBranch.address
        }
      });

      if (checkExisting && checkExisting.id !== id) {
        throw new ConflictException('Branch with this name and address already exists');
      }
    }

    await this.updateById(id, updateBranchDto);

    const updatedBranch = await this.findOneById(id);

    if (!updatedBranch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    return updatedBranch;
  }

  async deleteBranch(id: string): Promise<void> {
    const branch = await this.findOneById(id);

    if (!branch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Check if branch has associated accounts or rooms
    if (branch.accounts && branch.accounts.length > 0) {
      throw new ConflictException('Cannot delete branch with associated accounts');
    }

    if (branch.rooms && branch.rooms.length > 0) {
      throw new ConflictException('Cannot delete branch with associated rooms');
    }

    await this.deleteById(id);
  }

  async searchBranches(searchTerm: string): Promise<Branch[]> {
    return this.branchRepo
      .createQueryBuilder('branch')
      .where('branch.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('branch.address LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .getMany();
  }
}
