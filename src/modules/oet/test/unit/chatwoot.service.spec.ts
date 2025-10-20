import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ChatwootService, ChatwootConversationResponse, ChatwootMessage } from '../../services/chatwoot.service';

describe('ChatwootService - Unit Tests', () => {
  let service: ChatwootService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatwootService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config: Record<string, string> = {
                CHATWOOT_BASE_URL: 'https://test.chatwoot.com',
                CHATWOOT_TOKEN: 'test-token',
                CHATWOOT_ACCOUNT_ID: '1',
              };
              return config[key] || '';
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChatwootService>(ChatwootService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConversationMessages', () => {
    it('should get conversation messages successfully', async () => {
      // Arrange
      const conversationId = '12345';
      const mockResponse: AxiosResponse<ChatwootConversationResponse> = {
        data: {
          payload: [
            {
              id: 1,
              content: 'Hello',
              message_type: 'incoming',
              created_at: '2023-01-01',
              attachments: []
            }
          ]
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.getConversationMessages(conversationId);

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        `https://test.chatwoot.com/api/v1/accounts/1/conversations/${conversationId}/messages`,
        {
          headers: {
            'api_access_token': 'test-token',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
    });

    it('should throw error when token is not configured', async () => {
      // Arrange
      const conversationId = '12345';
      (service as any).token = '';

      // Act & Assert
      await expect(service.getConversationMessages(conversationId))
        .rejects
        .toThrow(new HttpException('Token do Chatwoot não configurado. Configure CHATWOOT_TOKEN nas variáveis de ambiente.', HttpStatus.INTERNAL_SERVER_ERROR));
    });

    it('should throw error when base URL is not configured', async () => {
      // Arrange
      const conversationId = '12345';
      (service as any).baseUrl = '';

      // Act & Assert
      await expect(service.getConversationMessages(conversationId))
        .rejects
        .toThrow(new HttpException('URL base do Chatwoot não configurada. Configure CHATWOOT_BASE_URL nas variáveis de ambiente.', HttpStatus.INTERNAL_SERVER_ERROR));
    });

    it('should handle 401 unauthorized error', async () => {
      // Arrange
      const conversationId = '12345';
      (service as any).token = 'test-token';
      (service as any).baseUrl = 'https://test.chatwoot.com';
      const error = {
        response: {
          status: 401
        }
      };

      httpService.get.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(service.getConversationMessages(conversationId))
        .rejects
        .toThrow(new HttpException('Token do Chatwoot inválido ou expirado', HttpStatus.UNAUTHORIZED));
    }, 12000);

    it('should handle 404 not found error', async () => {
      // Arrange
      const conversationId = '12345';
      (service as any).token = 'test-token';
      (service as any).baseUrl = 'https://test.chatwoot.com';
      const error = {
        response: {
          status: 404
        }
      };

      httpService.get.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(service.getConversationMessages(conversationId))
        .rejects
        .toThrow(new HttpException('Conversa não encontrada no Chatwoot', HttpStatus.NOT_FOUND));
    }, 12000);
  });

  describe('extractImageUrls', () => {
    it('should extract image URLs from messages', () => {
      // Arrange
      const messages: ChatwootMessage[] = [
        {
          id: 1,
          content: 'Hello',
          message_type: 'incoming',
          created_at: '2023-01-01',
          attachments: [
            {
              id: 1,
              file_type: 'image',
              data_url: 'https://example.com/image1.jpg',
              file_size: 1024
            },
            {
              id: 2,
              file_type: 'video',
              data_url: 'https://example.com/video.mp4',
              file_size: 2048
            }
          ]
        },
        {
          id: 2,
          content: 'World',
          message_type: 'outgoing',
          created_at: '2023-01-02',
          attachments: [
            {
              id: 3,
              file_type: 'image',
              file_url: 'https://example.com/image2.jpg',
              file_size: 512
            }
          ]
        }
      ];

      // Act
      const result = service.extractImageUrls(messages);

      // Assert
      expect(result).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ]);
    });

    it('should return empty array when no images found', () => {
      // Arrange
      const messages: ChatwootMessage[] = [
        {
          id: 1,
          content: 'Hello',
          message_type: 'incoming',
          created_at: '2023-01-01',
          attachments: [
            {
              id: 1,
              file_type: 'video',
              data_url: 'https://example.com/video.mp4',
              file_size: 2048
            }
          ]
        }
      ];

      // Act
      const result = service.extractImageUrls(messages);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle messages without attachments', () => {
      // Arrange
      const messages: ChatwootMessage[] = [
        {
          id: 1,
          content: 'Hello',
          message_type: 'incoming',
          created_at: '2023-01-01'
        }
      ];

      // Act
      const result = service.extractImageUrls(messages);

      // Assert
      expect(result).toEqual([]);
    });
  });
});

