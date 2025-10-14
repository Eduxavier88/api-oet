import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ProcessFilesUseCase } from '../../use-cases/process-files.use-case';

describe('ProcessFilesUseCase - Unit Tests', () => {
  let useCase: ProcessFilesUseCase;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [ProcessFilesUseCase],
    }).compile();

    useCase = module.get<ProcessFilesUseCase>(ProcessFilesUseCase);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return empty array when no files_urls provided', async () => {
      // Arrange
      const filesUrls = undefined;

      // Act
      const result = await useCase.execute(filesUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when files_urls is empty string', async () => {
      // Arrange
      const filesUrls = '';

      // Act
      const result = await useCase.execute(filesUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should process single file URL and return processed file', async () => {
      // Arrange
      const filesUrls = 'https://example.com/test.pdf';
      const mockFileContent = Buffer.from('test file content');
      
      // Mock HTTP response - CORRIGIDO
      const mockGet = jest.fn().mockResolvedValue({
        data: mockFileContent,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '18'
        }
      });
      
      // Substituir o método get
      httpService.axiosRef.get = mockGet;

      // Act
      const result = await useCase.execute(filesUrls);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        file: expect.any(String), // base64
        fil_sizexx: 17, // 'test file content' = 17 bytes
        nom_filexx: 'test.pdf',
        tip_attach: 'application/pdf'
      });
      expect(mockGet).toHaveBeenCalledWith('https://example.com/test.pdf', {
        responseType: 'arraybuffer',
        timeout: 15000
      });
    });

    it('should process multiple file URLs', async () => {
      // Arrange
      const filesUrls = 'https://example.com/file1.pdf,https://example.com/file2.jpg';
      const mockFileContent1 = Buffer.from('pdf content');
      const mockFileContent2 = Buffer.from('image content');
      
      // Mock HTTP responses
      const mockGet = jest.fn()
        .mockResolvedValueOnce({
          data: mockFileContent1,
          headers: {
            'content-type': 'application/pdf',
            'content-length': '12'
          }
        })
        .mockResolvedValueOnce({
          data: mockFileContent2,
          headers: {
            'content-type': 'image/jpeg',
            'content-length': '13'
          }
        });

      httpService.axiosRef.get = mockGet;

      // Act
      const result = await useCase.execute(filesUrls);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].nom_filexx).toBe('file1.pdf');
      expect(result[0].tip_attach).toBe('application/pdf');
      expect(result[1].nom_filexx).toBe('file2.jpg');
      expect(result[1].tip_attach).toBe('image/jpeg');
    });

    it('should throw error when file download fails', async () => {
      // Arrange
      const filesUrls = 'https://invalid-url.com/file.pdf';
      
      // Mock HTTP error
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      httpService.axiosRef.get = mockGet;

      // Act & Assert
      await expect(useCase.execute(filesUrls)).rejects.toThrow('Network error');
    });
  });
});