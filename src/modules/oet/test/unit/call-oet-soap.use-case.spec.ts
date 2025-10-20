import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CallOetSoapUseCase } from '../../use-cases/call-oet-soap.use-case';

describe('CallOetSoapUseCase - Unit Tests', () => {
  let useCase: CallOetSoapUseCase;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CallOetSoapUseCase,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'OET_WSDL_URL') {
                return 'https://oet-dev.intrared.net:8083/ap/interf/app/spg_new/spg.php?wsdl';
              }
              if (key === 'HTTP_TIMEOUT') {
                return 15000;
              }
              return undefined as any;
            }
          }
        }
      ],
    }).compile();

    useCase = module.get<CallOetSoapUseCase>(CallOetSoapUseCase);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should call OET SOAP API and return success response', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles = [
        {
          file: 'base64content',
          fil_sizexx: 1024,
          nom_filexx: 'test.pdf',
          tip_attach: 'application/pdf'
        }
      ];

      // Mock SOAP response from OET
      const mockSoapResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>1000</code_resp>
              <msg_resp>Se Crea Con Exito La Tarea 314245</msg_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`,
        status: 200,
        headers: { 'content-type': 'text/xml' }
      };

      // Mock HTTP call
      const mockPost = jest.fn().mockResolvedValue(mockSoapResponse);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'ok',
        task_id: '314245',
        message: 'Se Crea Con Exito La Tarea 314245'
      });

      // Verify SOAP call was made
      expect(mockPost).toHaveBeenCalled();
      const [url, body, config] = (mockPost as jest.Mock).mock.calls[0];
      expect(url).toEqual(expect.stringContaining('wsdl'));
      expect(body).toEqual(expect.stringContaining('setSoport'));
      expect(config).toEqual(expect.objectContaining({
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'urn:consult_base#setSoport'
        },
        timeout: expect.any(Number)
      }));
    });

    it('should handle OET authentication error', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'invalid_user',
        pwd_usulog: 'invalid_pass'
      };

      const processedFiles = [];

      // Mock SOAP error response from OET
      const mockSoapErrorResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>1002</code_resp>
              <msg_resp>Clave y/o usuario incorrectos.</msg_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`,
        status: 200,
        headers: { 'content-type': 'text/xml' }
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapErrorResponse);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_AUTH_ERROR',
        oet_code: '1002',
        message: 'Clave y/o usuario incorrectos.'
      });
    });

    it('should handle OET validation error', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'AB', // muito curto
        ema_usuari: 'invalid-email',
        tex_messag: 'Short',
        asu_messag: 'Err',
        tel_usuari: '123',
        nit_transp: '900',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles = [];

      // Mock SOAP validation error response from OET
      const mockSoapValidationErrorResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>6001</code_resp>
              <msg_resp>Campo - ema_usuari, Detalle - longitud minima invalida| Campo - nom_usuari, Detalle - longitud minima invalida</msg_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`,
        status: 200,
        headers: { 'content-type': 'text/xml' }
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapValidationErrorResponse);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_VALIDATION_ERROR',
        oet_code: '6001',
        message: 'Campo - ema_usuari, Detalle - longitud minima invalida| Campo - nom_usuari, Detalle - longitud minima invalida'
      });
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles = [];

      // Mock network timeout error
      const mockPost = jest.fn().mockRejectedValue(
        new Error('timeout of 15000ms exceeded')
      );
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_SERVICE_ERROR',
        message: 'Erro ao comunicar com serviço OET: timeout após 15 segundos',
        retry_available: true
      });
    });

    it('should handle unexpected SOAP response (generic error)', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles: any[] = [];

      const mockSoapWeirdResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n  <soap:Body>\n    <setSoportResponse>\n      <code_resp>9999</code_resp>\n      <msg_resp>Erro desconhecido</msg_resp>\n    </setSoportResponse>\n  </soap:Body>\n</soap:Envelope>`
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapWeirdResponse);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_ERROR',
        oet_code: '9999',
        message: 'Erro desconhecido'
      });
    });

    it('should handle OET parent task error (code 1001)', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles: any[] = [];

      const mockSoapParentTaskErrorResponse = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>1001</code_resp>
              <msg_resp>Error en tarea padre</msg_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapParentTaskErrorResponse);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_PARENT_TASK_ERROR',
        oet_code: '1001',
        message: 'Error en tarea padre'
      });
    });

    it('should handle missing WSDL URL configuration', async () => {
      // Arrange
      const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
          CallOetSoapUseCase,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string) => {
                if (key === 'HTTP_TIMEOUT') {
                  return 15000;
                }
                return undefined as any;
              }
            }
          }
        ],
      }).compile();

      const useCaseWithoutWSDL = module.get<CallOetSoapUseCase>(CallOetSoapUseCase);
      const httpServiceWithoutWSDL = module.get<HttpService>(HttpService);

      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles: any[] = [];

      // Act & Assert
      await expect(useCaseWithoutWSDL.execute(soapRequest, processedFiles)).rejects.toThrow('OET_WSDL_URL não configurada');
    });

    it('should handle SOAP response with missing task ID in success message', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles: any[] = [];

      const mockSoapResponseWithoutTaskId = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>1000</code_resp>
              <msg_resp>Se Crea Con Exito La Tarea</msg_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapResponseWithoutTaskId);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'ok',
        task_id: undefined,
        message: 'Se Crea Con Exito La Tarea'
      });
    });

    it('should handle SOAP response with missing message', async () => {
      // Arrange
      const soapRequest = {
        nom_usuari: 'Juan Pérez',
        ema_usuari: 'juan@example.com',
        tex_messag: 'Error en el sistema',
        asu_messag: 'Error del Sistema',
        tel_usuari: '+57 300 1234567',
        nit_transp: '900123456',
        id_project: '5678',
        nom_usulog: 'test_user',
        pwd_usulog: 'test_pass'
      };

      const processedFiles: any[] = [];

      const mockSoapResponseWithoutMessage = {
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <setSoportResponse>
              <code_resp>9999</code_resp>
            </setSoportResponse>
          </soap:Body>
        </soap:Envelope>`
      };

      const mockPost = jest.fn().mockResolvedValue(mockSoapResponseWithoutMessage);
      httpService.axiosRef.post = mockPost;

      // Act
      const result = await useCase.execute(soapRequest, processedFiles);

      // Assert
      expect(result).toEqual({
        status: 'error',
        code: 'OET_ERROR',
        oet_code: '9999',
        message: 'Erro desconhecido da OET'
      });
    });
  });
});
