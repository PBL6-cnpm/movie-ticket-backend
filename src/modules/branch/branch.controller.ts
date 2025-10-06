import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Branch } from '@shared/db/entities/branch.entity';
import { BranchService } from './branch.service';
import { BranchResponseDto } from './dto/branch-response.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
@ApiBearerAuth()
@ApiTags('Branches')
export class BranchController extends BaseController {
  private readonly logger = new Logger(BranchController.name);

  constructor(private readonly branchService: BranchService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new branch',
    description: 'Creates a new cinema branch with the provided name and address'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch created successfully',
    type: BranchResponseDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Branch with this name and address already exists'
  })
  async createBranch(
    @Body() createBranchDto: CreateBranchDto
  ): Promise<SuccessResponse<BranchResponseDto>> {
    this.logger.log(`Creating new branch: ${createBranchDto.name}`);
    const branch = await this.branchService.createNewBranch(createBranchDto);
    const response = new BranchResponseDto(branch);

    return this.created(response);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all branches',
    description: 'Retrieves all cinema branches with their associated accounts and rooms count'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of branches retrieved successfully',
    type: [BranchResponseDto]
  })
  async getAllBranches(): Promise<SuccessResponse<BranchResponseDto[]>> {
    this.logger.log('Fetching all branches');

    const branches = await this.branchService.getAllBranches();

    const response = branches.map((branch: Branch) => new BranchResponseDto(branch));

    return this.success(response);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get branch by ID',
    description: 'Retrieves a specific branch by its ID with associated data'
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch retrieved successfully',
    type: BranchResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found'
  })
  async getBranchById(@Param('id') id: string): Promise<SuccessResponse<BranchResponseDto>> {
    this.logger.log(`Fetching branch with ID: ${id}`);
    const branch = await this.branchService.getBranchById(id);
    const response = new BranchResponseDto(branch);

    return this.success(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update branch',
    description: 'Updates an existing branch with new information'
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch updated successfully',
    type: BranchResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Branch with this name and address already exists'
  })
  async updateBranch(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto
  ): Promise<SuccessResponse<BranchResponseDto>> {
    this.logger.log(`Updating branch with ID: ${id}`);
    const branch = await this.branchService.updateBranch(id, updateBranchDto);
    const response = new BranchResponseDto(branch);

    return this.success(response);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete branch',
    description: 'Deletes a branch if it has no associated accounts or rooms'
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete branch with associated accounts or rooms'
  })
  async deleteBranch(@Param('id') id: string): Promise<SuccessResponse<null>> {
    this.logger.log(`Deleting branch with ID: ${id}`);
    await this.branchService.deleteBranch(id);

    return this.success(null);
  }
}
