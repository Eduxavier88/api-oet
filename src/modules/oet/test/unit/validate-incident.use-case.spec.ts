import { ValidateIncidentUseCase } from '../../use-cases/validate-incident.use-case';

describe('ValidateIncidentUseCase - Unit Tests', () => {
  let useCase: ValidateIncidentUseCase;

  beforeEach(() => {
    useCase = new ValidateIncidentUseCase();
  });

  it('should validate successfully with correct data', async () => {
    const data = {
      nit_transp: '900261246',
      contact_name: 'John Doe',
      client_email: 'john@example.com',
      description: 'Descrição válida com mais de 10 caracteres',
      subject_name: 'Assunto válido',
      phone_user: '+57 300 1234567',
      conversationId: '33809',
    };

    const result = await useCase.execute(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should return validation errors with invalid data', async () => {
    const data = {
      nit_transp: '',
      contact_name: 'AB',
      client_email: 'invalid-email',
      description: 'curto',
      subject_name: 'abc',
      phone_user: '123',
    };

    const result = await useCase.execute(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});


