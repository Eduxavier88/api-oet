import { Injectable } from '@nestjs/common';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { ValidateIncidentUseCase } from '../use-cases/validate-incident.use-case';
import { TransformToSoapUseCase } from '../use-cases/transform-to-soap.use-case';
import { ProcessFilesUseCase } from '../use-cases/process-files.use-case';
import { CallOetSoapUseCase, OetIncidentResponse } from '../use-cases/call-oet-soap.use-case';

/**
 * @purpose Orquestra o processo completo de criação de incidência OET
 * @why Coordenar validação, transformação e comunicação com OET
 * @collaborators Use cases de validação, transformação, processamento e comunicação
 * @inputs Dados da incidência do Typebot
 * @outputs Resposta da OET com task_id ou erro
 * @sideEffects Chamadas para OET via SOAP
 * @errors Retorna erros de validação, comunicação ou processamento
 * @examples await service.createIncident(incidentData)
 */
@Injectable()
export class OetService {
  constructor(
    private readonly validateIncidentUseCase: ValidateIncidentUseCase,
    private readonly transformToSoapUseCase: TransformToSoapUseCase,
    private readonly processFilesUseCase: ProcessFilesUseCase,
    private readonly callOetSoapUseCase: CallOetSoapUseCase
  ) {}

  /**
   * @purpose Executa o fluxo completo de criação de incidência OET
   * @why Orquestrar todo o processo de criação de incidência
   * @collaborators Todos os use cases do módulo OET
   * @inputs Dados da incidência do Typebot
   * @outputs Resposta da OET com task_id ou erro
   * @sideEffects Chamadas para OET via SOAP
   * @errors Retorna erros de validação, comunicação ou processamento
   * @examples const result = await service.createIncident(incidentData)
   */
  async createIncident(data: CreateIncidentDto): Promise<OetIncidentResponse> {
    // 1. Validar dados
    const validation = await this.validateIncidentUseCase.execute(data);
    
    if (!validation.isValid) {
      return {
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: validation.errors
      };
    }

    // 2. Processar arquivos (se existirem)
    const processedFiles = await this.processFilesUseCase.execute(data.files_urls);

    // 3. Transformar para SOAP
    const soapRequest = await this.transformToSoapUseCase.execute(data);

    // 4. Chamar OET
    return this.callOetSoapUseCase.execute(soapRequest, processedFiles);
  }
}