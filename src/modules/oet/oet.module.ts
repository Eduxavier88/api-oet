import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { OetController } from './controllers/oet.controller';
import { OetService } from './services/oet.service';
import { ChatwootService } from './services/chatwoot.service';
import { ImageDownloadService } from './services/image-download.service';

// Use Cases
import { ValidateIncidentUseCase } from './use-cases/validate-incident.use-case';
import { TransformToSoapUseCase } from './use-cases/transform-to-soap.use-case';
import { ProcessFilesUseCase } from './use-cases/process-files.use-case';
import { CallOetSoapUseCase } from './use-cases/call-oet-soap.use-case';

/**
 * @purpose Módulo responsável pela integração com API OET
 * @why Organizar funcionalidades relacionadas à OET em um módulo coeso
 * @collaborators OetController, OetService, Use Cases
 * @inputs Nenhum
 * @outputs Módulo configurado para integração OET
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples Importado pelo AppModule
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: parseInt(process.env['HTTP_TIMEOUT'] || '15000', 10),
      maxRedirects: 2,
    }),
    ConfigModule,
  ],
  controllers: [OetController],
  providers: [
    OetService,
    ChatwootService,
    ImageDownloadService,
    // Use Cases
    ValidateIncidentUseCase,
    TransformToSoapUseCase,
    ProcessFilesUseCase,
    CallOetSoapUseCase,
  ],
  exports: [OetService],
})
export class OetModule {}