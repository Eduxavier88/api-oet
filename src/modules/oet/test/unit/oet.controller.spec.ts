import { Test, TestingModule } from '@nestjs/testing';
import { OetController } from '../../controllers/oet.controller';
import { OetService } from '../../services/oet.service';
import { CreateIncidentDto } from '../../dto/create-incident.dto';

describe('OetController - Unit Tests', () => {
  let controller: OetController;
  let oetService: jest.Mocked<OetService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OetController],
      providers: [
        {
          provide: OetService,
          useValue: {
            createIncident: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OetController>(OetController);
    oetService = module.get(OetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIncident', () => {
    it('should create incident successfully', async () => {
      // Arrange
      const createIncidentDto: CreateIncidentDto = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
      };

      const expectedResponse = {
        status: 'ok' as const,
        task_id: '12345',
        message: 'Incidência criada com sucesso',
      };

      oetService.createIncident.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createIncident(createIncidentDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(oetService.createIncident).toHaveBeenCalledWith(createIncidentDto);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const createIncidentDto: CreateIncidentDto = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
      };

      const expectedResponse = {
        status: 'error' as const,
        code: 'VALIDATION_ERROR',
        errors: ['NIT deve ter pelo menos 5 caracteres'],
      };

      oetService.createIncident.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createIncident(createIncidentDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.status).toBe('error');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty body', async () => {
      // Arrange
      const emptyDto = {} as CreateIncidentDto;

      const expectedResponse = {
        status: 'error' as const,
        code: 'VALIDATION_ERROR',
        errors: ['Body da requisição está vazio ou undefined'],
      };

      oetService.createIncident.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createIncident(emptyDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.status).toBe('error');
    });

    it('should handle service errors', async () => {
      // Arrange
      const createIncidentDto: CreateIncidentDto = {
        nit_transp: '900123456',
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
      };

      const serviceError = new Error('Service error');
      oetService.createIncident.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.createIncident(createIncidentDto)).rejects.toThrow('Service error');
    });

    it('should handle undefined body', async () => {
      // Arrange
      const expectedResponse = {
        status: 'error' as const,
        code: 'VALIDATION_ERROR',
        errors: ['Body da requisição está vazio ou undefined'],
      };

      oetService.createIncident.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createIncident(undefined as any);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.status).toBe('error');
    });
  });
});
