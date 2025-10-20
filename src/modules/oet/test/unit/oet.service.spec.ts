import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OetService } from '../../services/oet.service';
import { ValidateIncidentUseCase } from '../../use-cases/validate-incident.use-case';
import { TransformToSoapUseCase } from '../../use-cases/transform-to-soap.use-case';
import { ProcessFilesUseCase } from '../../use-cases/process-files.use-case';
import { CallOetSoapUseCase } from '../../use-cases/call-oet-soap.use-case';
import { ChatwootService } from '../../services/chatwoot.service';
import { ImageDownloadService } from '../../services/image-download.service';

describe('OetService - Unit Tests', () => {
  let service: OetService;
  let validateIncidentUseCase: jest.Mocked<ValidateIncidentUseCase>;
  let transformToSoapUseCase: jest.Mocked<TransformToSoapUseCase>;
  let processFilesUseCase: jest.Mocked<ProcessFilesUseCase>;
  let callOetSoapUseCase: jest.Mocked<CallOetSoapUseCase>;
  let chatwootService: jest.Mocked<ChatwootService>;
  let imageDownloadService: jest.Mocked<ImageDownloadService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OetService,
        {
          provide: ValidateIncidentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: TransformToSoapUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ProcessFilesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CallOetSoapUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ChatwootService,
          useValue: {
            getConversationMessages: jest.fn(),
            extractImageUrls: jest.fn(),
          },
        },
        {
          provide: ImageDownloadService,
          useValue: {
            downloadImages: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OetService>(OetService);
    validateIncidentUseCase = module.get(ValidateIncidentUseCase);
    transformToSoapUseCase = module.get(TransformToSoapUseCase);
    processFilesUseCase = module.get(ProcessFilesUseCase);
    callOetSoapUseCase = module.get(CallOetSoapUseCase);
    chatwootService = module.get(ChatwootService);
    imageDownloadService = module.get(ImageDownloadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIncident', () => {
    it('should create incident successfully', async () => {
      // Arrange
      const incidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema de facturación',
        subject_name: 'Error del Sistema - Facturación',
        phone_user: '+57 300 1234567',
        cod_product: '5678',
        files_urls: undefined,
        conversationId: '33809'
      };

      // Mock use cases
      validateIncidentUseCase.execute.mockResolvedValue({
        isValid: true,
        errors: []
      });

      // Mock Chatwoot service
      chatwootService.getConversationMessages.mockResolvedValue({
        payload: [
          {
            id: 1,
            content: 'test',
            message_type: 'incoming',
            created_at: '2023-01-01',
            attachments: [
              {
                id: 1,
                file_type: 'image',
                data_url: 'https://example.com/image.jpg',
                file_size: 1024
              }
            ]
          }
        ]
      });
      chatwootService.extractImageUrls.mockReturnValue(['https://example.com/image.jpg']);

      // Mock ImageDownloadService
      imageDownloadService.downloadImages.mockResolvedValue([
        {
          filename: 'image.jpg',
          contentType: 'image/jpeg',
          base64: 'data:image/jpeg;base64,test',
          size: 1024,
          originalUrl: 'https://example.com/image.jpg'
        }
      ]);

      transformToSoapUseCase.execute.mockResolvedValue({
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema de facturación',
        asu_messag: 'Error del Sistema - Facturación',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      });

      callOetSoapUseCase.execute.mockResolvedValue({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Act
      const result = await service.createIncident(incidentData);

      // Assert
      expect(result.status).toBe('ok');
      expect(result.task_id).toBe('314245');
      expect(result.message).toBe('Se Crea Con Exito La Tarea 314245');
      
      // Verify use cases were called
      expect(validateIncidentUseCase.execute).toHaveBeenCalledWith(incidentData);
      expect(chatwootService.getConversationMessages).toHaveBeenCalledWith('33809');
      expect(chatwootService.extractImageUrls).toHaveBeenCalled();
      expect(imageDownloadService.downloadImages).toHaveBeenCalledWith(['https://example.com/image.jpg']);
      expect(transformToSoapUseCase.execute).toHaveBeenCalledWith(incidentData);
      expect(callOetSoapUseCase.execute).toHaveBeenCalled();
    });

    it('should return error for invalid data', async () => {
      // Arrange
      const invalidData = {
        nit_transp: '', // inválido
        contact_name: 'AB', // muito curto
        client_email: 'invalid-email',
        description: 'Short',
        subject_name: 'Err',
        phone_user: '123'
      };

      // Mock validation failure
      validateIncidentUseCase.execute.mockResolvedValue({
        isValid: false,
        errors: ['NIT deve ter pelo menos 5 caracteres', 'Nome deve ter pelo menos 3 caracteres']
      });

      // Act
      const result = await service.createIncident(invalidData);

      // Assert
      expect(result.status).toBe('error');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.errors).toEqual(['NIT deve ter pelo menos 5 caracteres', 'Nome deve ter pelo menos 3 caracteres']);
      
      // Verify other use cases were not called
      expect(processFilesUseCase.execute).not.toHaveBeenCalled();
      expect(transformToSoapUseCase.execute).not.toHaveBeenCalled();
      expect(callOetSoapUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle undefined data', async () => {
      // Act
      const result = await service.createIncident(undefined as any);

      // Assert
      expect(result.status).toBe('error');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.errors).toEqual(['Dados da requisição estão undefined']);
    });

    it('should handle Chatwoot service errors gracefully', async () => {
      // Arrange
      const incidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        conversationId: '33809'
      };

      // Mock validation success
      validateIncidentUseCase.execute.mockResolvedValue({
        isValid: true,
        errors: []
      });

      // Mock Chatwoot service error
      chatwootService.getConversationMessages.mockRejectedValue(new Error('Chatwoot error'));

      transformToSoapUseCase.execute.mockResolvedValue({
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '52',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      });

      callOetSoapUseCase.execute.mockResolvedValue({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Act
      const result = await service.createIncident(incidentData);

      // Assert
      expect(result.status).toBe('ok');
      expect(result.task_id).toBe('314245');
      
      // Verify Chatwoot was called but error was handled
      expect(chatwootService.getConversationMessages).toHaveBeenCalledWith('33809');
      expect(imageDownloadService.downloadImages).not.toHaveBeenCalled();
    });

    it('should handle image download errors gracefully', async () => {
      // Arrange
      const incidentData = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        conversationId: '33809'
      };

      // Mock validation success
      validateIncidentUseCase.execute.mockResolvedValue({
        isValid: true,
        errors: []
      });

      // Mock Chatwoot service success
      chatwootService.getConversationMessages.mockResolvedValue({
        payload: [
          {
            id: 1,
            content: 'test',
            message_type: 'incoming',
            created_at: '2023-01-01',
            attachments: [
              {
                id: 1,
                file_type: 'image',
                data_url: 'https://example.com/image.jpg',
                file_size: 1024
              }
            ]
          }
        ]
      });
      chatwootService.extractImageUrls.mockReturnValue(['https://example.com/image.jpg']);

      // Mock ImageDownloadService error
      imageDownloadService.downloadImages.mockRejectedValue(new Error('Download error'));

      transformToSoapUseCase.execute.mockResolvedValue({
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '52',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      });

      callOetSoapUseCase.execute.mockResolvedValue({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Act
      const result = await service.createIncident(incidentData);

      // Assert
      expect(result.status).toBe('ok');
      expect(result.task_id).toBe('314245');
      
      // Verify image download was called but error was handled
      expect(imageDownloadService.downloadImages).toHaveBeenCalledWith(['https://example.com/image.jpg']);
    });
  });
});