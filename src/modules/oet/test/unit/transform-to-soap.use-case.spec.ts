import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TransformToSoapUseCase } from '../../use-cases/transform-to-soap.use-case';

// Mock das credenciais OET
jest.mock('../../../../config/oet-credentials.config', () => ({
  getOetCredentials: () => ({
    username: 'test_user',
    password: 'test_password',
  }),
}));

describe('TransformToSoapUseCase - Unit Tests', () => {
  let useCase: TransformToSoapUseCase;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformToSoapUseCase,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<TransformToSoapUseCase>(TransformToSoapUseCase);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should transform incident data to SOAP request format', async () => {
      // Arrange
      const incidentData = {
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'OET_DEFAULT_PROJECT_ID') return undefined;
        return 'test_user';
      });

      // Act
      const result = await useCase.execute(incidentData);

      // Assert
      expect(result).toEqual({
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: expect.any(String),
        pwd_usulog: expect.any(String),
      });
    });

    it('should use default project ID when not provided', async () => {
      // Arrange
      const incidentData = {
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        nit_transp: '900123456',
        // id_project not provided
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'OET_DEFAULT_PROJECT_ID') return '52';
        return 'test_user';
      });

      // Act
      const result = await useCase.execute(incidentData);

      // Assert
      expect(result.id_project).toBe('52');
    });

    it('should use fallback project ID when config is not set', async () => {
      // Arrange
      const incidentData = {
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        nit_transp: '900123456',
        // id_project not provided
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'OET_DEFAULT_PROJECT_ID') return undefined;
        return 'test_user';
      });

      // Act
      const result = await useCase.execute(incidentData);

      // Assert
      expect(result.id_project).toBe('52'); // fallback value
    });

    it('should prioritize provided id_project over config', async () => {
      // Arrange
      const incidentData = {
        contact_name: 'Juan Pérez',
        client_email: 'juan@example.com',
        description: 'Error en el sistema',
        subject_name: 'Error del Sistema',
        phone_user: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '9999', // explicitly provided
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'OET_DEFAULT_PROJECT_ID') return '52';
        return 'test_user';
      });

      // Act
      const result = await useCase.execute(incidentData);

      // Assert
      expect(result.id_project).toBe('9999'); // should use provided value
    });
  });
});
