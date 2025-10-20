import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OetService } from '../services/oet.service';
import { OetIncidentResponse } from '../use-cases/call-oet-soap.use-case';


@Controller('api/v1/integrations/oet')
export class OetController {
  private readonly logger = new Logger(OetController.name);

  constructor(private readonly oetService: OetService) {}


  @Post('incidents')
  @HttpCode(HttpStatus.OK)
  async createIncident(
    @Body() createIncidentDto: any, 
    @Headers('x-request-id') _requestId?: string,
  ): Promise<OetIncidentResponse> {
    
    const rawNit = createIncidentDto?.nit_transp;
    const maskedNit = typeof rawNit === 'string' && rawNit.length > 3 ? `***${rawNit.slice(-3)}` : 'N/A';
    this.logger.log(`[REQUEST] Nova requisição recebida - NIT: ${maskedNit}`);
    
    try {
      
      if (!createIncidentDto || Object.keys(createIncidentDto).length === 0) {
        this.logger.error('[ERROR] Body da requisição está vazio ou undefined');
        return {
          status: 'error',
          code: 'VALIDATION_ERROR',
          errors: ['Body da requisição está vazio ou undefined']
        };
      }

      const result = await this.oetService.createIncident(createIncidentDto);
      
      const taskPart = result.task_id ? ' - Task ID: ' + result.task_id : '';
      this.logger.log(`[RESPONSE] Status: ${result.status}${taskPart}`);
      return result;
    } catch (error) {
     
      this.logger.error(`[ERROR] ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      this.logger.error(`[ERROR] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
      throw error;
    }
  }
}

