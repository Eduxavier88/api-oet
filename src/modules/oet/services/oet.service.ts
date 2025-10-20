import { Injectable, Logger } from '@nestjs/common';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { ValidateIncidentUseCase } from '../use-cases/validate-incident.use-case';
import { TransformToSoapUseCase } from '../use-cases/transform-to-soap.use-case';
import { CallOetSoapUseCase, OetIncidentResponse } from '../use-cases/call-oet-soap.use-case';
import { ChatwootService } from './chatwoot.service';
import { ImageDownloadService } from './image-download.service';

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
  private readonly logger = new Logger(OetService.name);

  constructor(
    private readonly validateIncidentUseCase: ValidateIncidentUseCase,
    private readonly transformToSoapUseCase: TransformToSoapUseCase,
    private readonly callOetSoapUseCase: CallOetSoapUseCase,
    private readonly chatwootService: ChatwootService,
    private readonly imageDownloadService: ImageDownloadService
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
    // Verificação defensiva
    if (!data) {
      this.logger.error('[OET_SERVICE] Dados da requisição estão undefined');
      return {
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: ['Dados da requisição estão undefined']
      };
    }

          const nit = data.nit_transp;
          const maskedNit = typeof nit === 'string' && nit.length > 3 ? `***${nit.slice(-3)}` : 'N/A';
          this.logger.log(`[OET_SERVICE] Iniciando criação de incidência para NIT: ${maskedNit}`);
    
    // 1. Validar dados
    const validation = await this.validateIncidentUseCase.execute(data);
    
    if (!validation.isValid) {
      this.logger.error(`[OET_SERVICE] Validação falhou: ${validation.errors.join(', ')}`);
      return {
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: validation.errors
      };
    }

    // 2. Buscar imagens do Chatwoot (se conversationId fornecido)
    let chatwootImages: string[] = [];
    if (data.conversationId) {
      try {
               this.logger.log(`[OET_SERVICE] Buscando imagens do Chatwoot para conversa: ${data.conversationId}`);
        const chatwootResponse = await this.chatwootService.getConversationMessages(data.conversationId);
        chatwootImages = this.chatwootService.extractImageUrls(chatwootResponse.payload);
               this.logger.log(`[OET_SERVICE] Encontradas ${chatwootImages.length} imagens no Chatwoot`);
      } catch (error) {
        this.logger.warn(`[OET_SERVICE] Erro ao buscar imagens do Chatwoot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        // Continua o fluxo mesmo se falhar
      }
    }

    // 3. Baixar e converter imagens do Chatwoot
    let processedChatwootImages: any[] = [];
    if (chatwootImages.length > 0) {
      try {
        this.logger.log(`[OET_SERVICE] Baixando ${chatwootImages.length} imagens do Chatwoot`);
        processedChatwootImages = await this.imageDownloadService.downloadImages(chatwootImages);
        this.logger.log(`[OET_SERVICE] ${processedChatwootImages.length} imagens do Chatwoot processadas com sucesso`);
      } catch (error) {
        this.logger.warn(`[OET_SERVICE] Erro ao processar imagens do Chatwoot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        // Continua o fluxo mesmo se falhar
      }
    }

    // 4. Usar apenas imagens do Chatwoot (Typebot não envia arquivos)
    const allProcessedFiles = processedChatwootImages;
    this.logger.log(`[OET_SERVICE] Total de arquivos processados: ${allProcessedFiles.length}`);

    // 6. Transformar para SOAP
    const soapRequest = await this.transformToSoapUseCase.execute(data);

    // 7. Chamar OET
    this.logger.log(`[OET_SERVICE] Enviando para OET...`);
    return this.callOetSoapUseCase.execute(soapRequest, allProcessedFiles);
  }
}