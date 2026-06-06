import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  teamName: string;

  @IsUUID()
  @IsNotEmpty()
  adminId: string;

  @IsArray()
  @IsOptional()
  members?: TeamMemberDto[];
}

export class TeamMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  roleName?: string;
}

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  teamName?: string;

  @IsUUID()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsOptional()
  adminName?: string;

  @IsArray()
  @IsOptional()
  memberIds?: string[];
}

export class AddTeamMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  roleName?: string;
}

export class UpdateTeamMemberDto {
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  roleName?: string;
}
