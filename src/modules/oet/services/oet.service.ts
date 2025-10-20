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

  
  async createIncident(data: CreateIncidentDto): Promise<OetIncidentResponse> {
    
    if (!data) {
      return this.validationError(['Dados da requisição estão undefined']);
    }

    
    this.logger.log(`[OET_SERVICE] Iniciando criação de incidência para NIT: ${this.maskNit(data.nit_transp)}`);

   
    const validation = await this.validateIncidentUseCase.execute(data);
    if (!validation.isValid) {
      this.logger.error(`[OET_SERVICE] Validação falhou: ${validation.errors.join(', ')}`);
      return this.validationError(validation.errors);
    }

    
    const chatwootImageUrls = await this.getChatwootImageUrls(data.conversationId);

    
    const processedFiles = await this.processChatwootImages(chatwootImageUrls);
    this.logger.log(`[OET_SERVICE] Total de arquivos processados: ${processedFiles.length}`);

    
    const soapRequest = await this.transformToSoapUseCase.execute(data);
    this.logger.log('[OET_SERVICE] Enviando para OET...');
    return this.callOetSoapUseCase.execute(soapRequest, processedFiles);
  }

  
  private validationError(errors: string[]): OetIncidentResponse {
    return { status: 'error', code: 'VALIDATION_ERROR', errors };
  }

  private maskNit(nit: string | undefined): string {
    return typeof nit === 'string' && nit.length > 3 ? `***${nit.slice(-3)}` : 'N/A';
  }

  private async getChatwootImageUrls(conversationId?: string): Promise<string[]> {
    if (!conversationId) return [];
    try {
      this.logger.log(`[OET_SERVICE] Buscando imagens do Chatwoot para conversa: ${conversationId}`);
      const chatwootResponse = await this.chatwootService.getConversationMessages(conversationId);
      const urls = this.chatwootService.extractImageUrls(chatwootResponse.payload);
      this.logger.log(`[OET_SERVICE] Encontradas ${urls.length} imagens no Chatwoot`);
      return urls;
    } catch (error) {
      this.logger.warn(`[OET_SERVICE] Erro ao buscar imagens do Chatwoot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    }
  }

  private async processChatwootImages(imageUrls: string[]): Promise<any[]> {
    if (imageUrls.length === 0) return [];
    try {
      this.logger.log(`[OET_SERVICE] Baixando ${imageUrls.length} imagens do Chatwoot`);
      const files = await this.imageDownloadService.downloadImages(imageUrls);
      this.logger.log(`[OET_SERVICE] ${files.length} imagens do Chatwoot processadas com sucesso`);
      return files;
    } catch (error) {
      this.logger.warn(`[OET_SERVICE] Erro ao processar imagens do Chatwoot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    }
  }
}