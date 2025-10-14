import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateIncidentDto } from '../dto/create-incident.dto';

/**
 * @purpose Valida dados de incidência usando DTO e class-validator
 * @why Centralizar validação de negócio de forma reutilizável
 * @collaborators CreateIncidentDto, class-validator
 * @inputs Dados brutos da incidência
 * @outputs Resultado da validação com erros detalhados
 * @sideEffects Nenhum
 * @errors Retorna erros de validação estruturados
 * @examples await useCase.execute(incidentData)
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class ValidateIncidentUseCase {
  /**
   * @purpose Executa validação completa dos dados de incidência
   * @why Garantir integridade dos dados antes do processamento
   * @collaborators CreateIncidentDto, class-validator
   * @inputs Dados da incidência
   * @outputs Resultado da validação
   * @sideEffects Nenhum
   * @errors Retorna erros de validação estruturados
   * @examples const result = await useCase.execute(incidentData)
   */
  async execute(data: any): Promise<ValidationResult> {
    // Transformar dados em DTO
    const dto = plainToInstance(CreateIncidentDto, data);
    
    // Validar usando class-validator
    const errors = await validate(dto);
    
    // Extrair mensagens de erro
    const errorMessages = errors.flatMap(error => 
      Object.values(error.constraints || {})
    );

    return {
      isValid: errorMessages.length === 0,
      errors: errorMessages,
    };
  }
}
