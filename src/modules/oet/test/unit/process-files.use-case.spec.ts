import { Test, TestingModule } from '@nestjs/testing';
import { ProcessFilesUseCase } from '../../use-cases/process-files.use-case';

describe('ProcessFilesUseCase - Unit Tests', () => {
  let useCase: ProcessFilesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessFilesUseCase],
    }).compile();

    useCase = module.get<ProcessFilesUseCase>(ProcessFilesUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return empty array when no files provided', async () => {
      // Act
      const result = await useCase.execute('');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when null provided', async () => {
      // Act
      const result = await useCase.execute(null as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should process valid base64 file', async () => {
      // Arrange
      const base64File = 'data:application/pdf;base64,UEZGaWxlIGNvbnRlbnQ='; // "PDF file content" in base64

      // Act
      const result = await useCase.execute(base64File);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        file: expect.any(String),
        fil_sizexx: 14,
        nom_filexx: expect.stringContaining('.pdf'),
        tip_attach: 'application/pdf'
      });
    });

    it('should throw error for invalid base64 format', async () => {
      // Arrange
      const invalidBase64 = 'invalid-base64-string';

      // Act & Assert
      await expect(useCase.execute(invalidBase64))
        .rejects
        .toThrow('Erro ao processar arquivo base64: Formato base64 inválido');
    });
  });
});
