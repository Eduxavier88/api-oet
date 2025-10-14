import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { OetService } from '../services/oet.service';
import { OetIncidentResponse } from '../use-cases/call-oet-soap.use-case';


@Controller('api/v1/integrations/oet')
export class OetController {
  constructor(private readonly oetService: OetService) {}


  @Post('incidents')
  @HttpCode(HttpStatus.OK)
  async createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @Headers('x-request-id') _requestId?: string,
  ): Promise<OetIncidentResponse> {
    return this.oetService.createIncident(createIncidentDto);
  }
}

