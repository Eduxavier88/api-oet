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
            get: jest.fn().mockReturnValue('https://oet-dev.intrared.net:8083/ap/interf/app/spg_new/spg.php?wsdl')
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
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('wsdl'),
        expect.stringContaining('setSoport'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'setSoport'
          },
          timeout: 15000
        })
      );
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
  });
});
