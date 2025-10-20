import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty({ message: 'NIT é obrigatório' })
  @MinLength(5, { message: 'NIT deve ter pelo menos 5 caracteres' })
  @MaxLength(50, { message: 'NIT deve ter no máximo 50 caracteres' })
  @Matches(/^[\d-]+$/, { message: 'NIT deve conter apenas números e hífens' })
  nit_transp!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do contato é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  contact_name!: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  client_email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(10, { message: 'Descrição deve ter pelo menos 10 caracteres' })
  @MaxLength(5000, { message: 'Descrição deve ter no máximo 5000 caracteres' })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: 'Assunto é obrigatório' })
  @MinLength(5, { message: 'Assunto deve ter pelo menos 5 caracteres' })
  @MaxLength(200, { message: 'Assunto deve ter no máximo 200 caracteres' })
  subject_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @MinLength(7, { message: 'Telefone deve ter pelo menos 7 caracteres' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  @Matches(/^\+?[\d\s()\-]+$/, { message: 'Formato de telefone inválido' })
  phone_user!: string;

  @IsOptional()
  @IsString()
  files_urls?: string; 

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Código do produto deve ter no máximo 50 caracteres' })
  @Matches(/^\d+$/, { message: 'Código do produto deve conter apenas números' })
  cod_product?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'ID do projeto deve ter no máximo 50 caracteres' })
  @Matches(/^\d+$/, { message: 'ID do projeto deve conter apenas números' })
  id_project?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'ID da conversa deve ter no máximo 20 caracteres' })
  @Matches(/^\d+$/, { message: 'ID da conversa deve conter apenas números' })
  conversationId?: string;
}

