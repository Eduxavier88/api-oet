import { validateNitColombia } from './nit-colombia.validator';

describe('validateNitColombia', () => {
  it('deve aceitar NIT com 9 dígitos', () => {
    expect(() => validateNitColombia('123456789')).not.toThrow();
  });

  it('deve rejeitar NIT com caracteres inválidos', () => {
    expect(() => validateNitColombia('12A456789')).toThrow('NIT deve conter apenas números e hífen');
  });

  it('deve rejeitar NIT com tamanho inválido sem hífen', () => {
    expect(() => validateNitColombia('12345678')).toThrow('NIT deve ter exatamente 9 dígitos');
  });

  it('deve rejeitar NIT com tamanho inválido com hífen', () => {
    expect(() => validateNitColombia('12345678-9')).toThrow('NIT deve ter exatamente 9 dígitos + hífen + 1 dígito verificador');
  });

  it('deve verificar dígito verificador quando contém hífen (inválido)', () => {
    expect(() => validateNitColombia('123456789-0')).toThrow('Dígito verificador do NIT inválido');
  });
});
