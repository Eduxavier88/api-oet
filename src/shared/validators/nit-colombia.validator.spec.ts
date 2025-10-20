import { validateNitColombia } from './nit-colombia.validator';

describe('NitColombiaValidator', () => {
  describe('validateNitColombia', () => {
    it('should validate correct NIT format with check digit', () => {
      // Arrange
      const validNits = [
        '900123456-3', 
        '800123456-8',  
        '123456789-5',  
        '987654321-2'   
      ];

      // Act & Assert
      validNits.forEach(nit => {
        expect(() => validateNitColombia(nit)).not.toThrow();
      });
    });

    it('should validate NIT without check digit (from Typebot)', () => {
      // Arrange
      const validNitsWithoutCheckDigit = [
        '900123456',  // NIT do Typebot (sem hífen)
        '800123456',  // NIT do Typebot (sem hífen)
        '123456789'   // NIT do Typebot (sem hífen)
      ];

      // Act & Assert
      validNitsWithoutCheckDigit.forEach(nit => {
        expect(() => validateNitColombia(nit)).not.toThrow();
      });
    });

    it('should reject NIT with wrong length', () => {
      // Arrange
      const invalidNits = [
        '12345',      // muito curto
        '1234567890', // muito longo (10 dígitos)
        '12345678'    // 8 dígitos
      ];

      // Act & Assert
      invalidNits.forEach(nit => {
        expect(() => validateNitColombia(nit)).toThrow('NIT deve ter exatamente 9 dígitos');
      });
    });

    it('should reject NIT with hifen but wrong length', () => {
      // Arrange
      const invalidNits = [
        '12345-6',      // muito curto
        '1234567890-1', // muito longo
        '12345678-9'    // 8 dígitos
      ];

      // Act & Assert
      invalidNits.forEach(nit => {
        expect(() => validateNitColombia(nit)).toThrow('NIT deve ter exatamente 9 dígitos + hífen + 1 dígito verificador');
      });
    });

    it('should reject NIT with invalid check digit', () => {
      // Arrange
      const invalidNits = [
        '900123456-8', 
        '800123456-2', 
        '123456789-1'  
      ];

      // Act & Assert
      invalidNits.forEach(nit => {
        expect(() => validateNitColombia(nit)).toThrow('Dígito verificador do NIT inválido');
      });
    });

    it('should reject NIT with non-numeric characters', () => {
      // Arrange
      const invalidNits = [
        '90012345a-7',
        '90012345A-7',
        '90012345@-7',
        'abc123456-7'
      ];

      // Act & Assert
      invalidNits.forEach(nit => {
        expect(() => validateNitColombia(nit)).toThrow('NIT deve conter apenas números e hífen');
      });
    });

    it('should reject empty or null NIT', () => {
      // Arrange
      const invalidNits = ['', null, undefined];

      // Act & Assert
      invalidNits.forEach(nit => {
        expect(() => validateNitColombia(nit as any)).toThrow('NIT é obrigatório');
      });
    });

    it('should handle NIT with spaces and trim them', () => {
      // Arrange
      const nitWithSpaces = ' 900123456-3 ';

      // Act & Assert
      expect(() => validateNitColombia(nitWithSpaces)).not.toThrow();
    });
  });
});
