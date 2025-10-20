import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import request from 'supertest';

import { OetController } from '../../controllers/oet.controller';
import { OetService } from '../../services/oet.service';
import { ValidateIncidentUseCase } from '../../use-cases/validate-incident.use-case';
import { TransformToSoapUseCase } from '../../use-cases/transform-to-soap.use-case';
import { ProcessFilesUseCase } from '../../use-cases/process-files.use-case';
import { CallOetSoapUseCase } from '../../use-cases/call-oet-soap.use-case';
import { ChatwootService } from '../../services/chatwoot.service';
import { ImageDownloadService } from '../../services/image-download.service';

describe('OetController Integration Tests', () => {
  let app: INestApplication;
  let oetService: OetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        HttpModule.register({
          timeout: 15000,
          maxRedirects: 2,
        }),
      ],
      controllers: [OetController],
      providers: [
        OetService,
        ValidateIncidentUseCase,
        TransformToSoapUseCase,
        ProcessFilesUseCase,
        CallOetSoapUseCase,
        ChatwootService,
        ImageDownloadService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    oetService = module.get<OetService>(OetService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/integrations/oet/incidents', () => {
    it('should create incident successfully with valid data', async () => {
      // Arrange
      const validIncidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema de facturación',
        subject_name: 'Error del Sistema - Facturación',
        phone_user: '+57 300 1234567',
        cod_product: '5678',
        files_urls: undefined
      };

      // Mock OetService response
      jest.spyOn(oetService, 'createIncident').mockResolvedValue({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/integrations/oet/incidents')
        .send(validIncidentData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      expect(oetService.createIncident).toHaveBeenCalledWith(validIncidentData);
    });

    it('should return validation error with invalid data', async () => {
      // Arrange
      const invalidIncidentData = {
        nit_transp: '', // inválido
        contact_name: 'AB', // muito curto
        client_email: 'invalid-email',
        description: 'Short',
        subject_name: 'Err',
        phone_user: '123'
      };

      // Mock OetService validation error
      jest.spyOn(oetService, 'createIncident').mockResolvedValue({
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: ['NIT deve ter pelo menos 5 caracteres', 'Nome deve ter pelo menos 3 caracteres']
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/integrations/oet/incidents')
        .send(invalidIncidentData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: ['NIT deve ter pelo menos 5 caracteres', 'Nome deve ter pelo menos 3 caracteres']
      });

      expect(oetService.createIncident).toHaveBeenCalledWith(invalidIncidentData);
    });

    it('should return OET authentication error', async () => {
      // Arrange
      const validIncidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema de facturación',
        subject_name: 'Error del Sistema - Facturación',
        phone_user: '+57 300 1234567',
        cod_product: '5678'
      };

      // Mock OetService OET error
      jest.spyOn(oetService, 'createIncident').mockResolvedValue({
        status: 'error',
        code: 'OET_AUTH_ERROR',
        oet_code: '1002',
        message: 'Clave y/o usuario incorrectos.'
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/integrations/oet/incidents')
        .send(validIncidentData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        code: 'OET_AUTH_ERROR',
        oet_code: '1002',
        message: 'Clave y/o usuario incorrectos.'
      });

      expect(oetService.createIncident).toHaveBeenCalledWith(validIncidentData);
    });

    it('should handle X-Request-ID header', async () => {
      // Arrange
      const validIncidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema de facturación',
        subject_name: 'Error del Sistema - Facturación',
        phone_user: '+57 300 1234567'
      };

      const requestId = 'test-request-id-123';

      // Mock OetService response
      jest.spyOn(oetService, 'createIncident').mockResolvedValue({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/integrations/oet/incidents')
        .set('X-Request-ID', requestId)
        .send(validIncidentData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      expect(oetService.createIncident).toHaveBeenCalledWith(validIncidentData);
    });
  });
});
