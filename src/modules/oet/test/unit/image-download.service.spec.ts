import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ImageDownloadService } from '../../services/image-download.service';

describe('ImageDownloadService - Unit Tests', () => {
  let service: ImageDownloadService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageDownloadService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
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

    service = module.get<ImageDownloadService>(ImageDownloadService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    // Mock config values
    configService.get.mockImplementation((key: string) => {
      const config = {
        'files.maxFileSize': 5242880, // 5MB
        'files.maxTotalFileSize': 26214400, // 25MB
        'files.maxFilesCount': 10,
      };
      return config[key] || undefined;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('downloadImages', () => {
    it('should download and process images successfully', async () => {
      // Arrange
      const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      const mockImageData = Buffer.from('fake-image-data');

      const mockResponse1 = {
        data: mockImageData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      const mockResponse2 = {
        data: mockImageData,
        headers: {
          'content-type': 'image/png',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get
        .mockReturnValueOnce(of(mockResponse1))
        .mockReturnValueOnce(of(mockResponse2));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        filename: expect.stringContaining('.jpg'),
        contentType: 'image/jpeg',
        base64: expect.stringContaining('data:image/jpeg;base64,'),
        size: 16,
        originalUrl: 'https://example.com/image1.jpg'
      });
      expect(result[1]).toMatchObject({
        filename: 'image2.jpg',
        contentType: 'image/png',
        base64: expect.stringContaining('data:image/png;base64,'),
        size: 16,
        originalUrl: 'https://example.com/image2.jpg'
      });
    });

    it('should return empty array when no URLs provided', async () => {
      // Act
      const result = await service.downloadImages([]);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle too many files by returning empty array', async () => {
      // Arrange
      const tooManyUrls = Array(11).fill('https://example.com/image.jpg');

      // Act
      const result = await service.downloadImages(tooManyUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle download failures gracefully', async () => {
      // Arrange
      const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/invalid.jpg'];
      const mockImageData = Buffer.from('fake-image-data');

      const mockResponse = {
        data: mockImageData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get
        .mockReturnValueOnce(of(mockResponse))
        .mockReturnValueOnce(throwError(() => new Error('Network error')));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].originalUrl).toBe('https://example.com/image1.jpg');
    });

    it('should throw error for invalid content type', async () => {
      // Arrange
      const imageUrls = ['https://example.com/document.pdf'];
      const mockData = Buffer.from('fake-pdf-data');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error for file too large', async () => {
      // Arrange
      const imageUrls = ['https://example.com/large-image.jpg'];
      const mockData = Buffer.from('x'.repeat(6000000)); // 6MB

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '6000000'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty file size', async () => {
      // Arrange
      const imageUrls = ['https://example.com/empty.jpg'];
      const mockData = Buffer.from('');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '0'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle undefined content-length header', async () => {
      // Arrange
      const imageUrls = ['https://example.com/image.jpg'];
      const mockData = Buffer.from('fake-image-data');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': undefined
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle filename generation with URL path', async () => {
      // Arrange
      const imageUrls = ['https://example.com/path/to/image.jpg'];
      const mockData = Buffer.from('fake-image-data');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('image.jpg');
    });

    it('should handle filename generation with invalid URL', async () => {
      // Arrange
      const imageUrls = ['invalid-url'];
      const mockData = Buffer.from('fake-image-data');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].filename).toMatch(/^image_\d+\.jpeg$/);
    });

    it('should handle filename generation with URL without extension', async () => {
      // Arrange
      const imageUrls = ['https://example.com/image'];
      const mockData = Buffer.from('fake-image-data');

      const mockResponse = {
        data: mockData,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '16'
        },
        status: 200,
        statusText: 'OK',
        config: { headers: undefined as any }
      };

      httpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].filename).toMatch(/^image_\d+\.jpeg$/);
    });

    it('should handle general error in downloadImages', async () => {
      // Arrange
      const imageUrls = ['https://example.com/image.jpg'];

      // Mock a general error
      httpService.get.mockReturnValue(throwError(() => new Error('General error')));

      // Act
      const result = await service.downloadImages(imageUrls);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
