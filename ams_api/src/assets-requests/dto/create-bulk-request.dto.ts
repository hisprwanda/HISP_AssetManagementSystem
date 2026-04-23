import { IsArray, IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBulkRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  requestable_item_ids: string[];

  @IsString()
  @IsNotEmpty()
  justification: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
