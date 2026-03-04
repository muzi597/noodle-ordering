import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';

export class CustomerOrderItemDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  qty: number;

  @IsInt()
  @Min(0)
  priceCents: number;
}

export class CreateCustomerOrderDto {
  @IsString()
  shopId: string;

  @IsString()
  tableCode: string;

  @IsString()
  shopName: string;

  @IsString()
  v: string;

  @IsString()
  sig: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderItemDto)
  items: CustomerOrderItemDto[];
}
