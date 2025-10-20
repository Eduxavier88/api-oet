

/**
 * Valida se o NIT colombiano está no formato correto
 * Aceita: 9 dígitos (sem hífen) ou 9 dígitos + hífen + 1 dígito verificador
 * @param nit - NIT a ser validado
 * @throws Error se o NIT for inválido
 */
export function validateNitColombia(nit: string): void {
  // Validação de entrada
  validateInput(nit);
  
  const trimmedNit = nit.trim();
  
  // Validação de formato
  validateFormat(trimmedNit);
  
  // Validação do dígito verificador (se houver)
  if (trimmedNit.includes('-')) {
    validateCheckDigit(trimmedNit);
  }
}

/**
 * Valida se a entrada não está vazia
 * @param nit - NIT a ser validado
 * @throws Error se o NIT for vazio
 */
function validateInput(nit: string): void {
  if (!nit || nit.trim() === '') {
    throw new Error('NIT é obrigatório');
  }
}

/**
 * Valida o formato básico do NIT
 * @param nit - NIT a ser validado
 * @throws Error se o formato for inválido
 */
function validateFormat(nit: string): void {
  // Verificar caracteres válidos
  if (!/^[\d-]+$/.test(nit)) {
    throw new Error('NIT deve conter apenas números e hífen');
  }

  // Verificar se tem hífen
  if (nit.includes('-')) {
    // Formato com hífen: 9 dígitos + hífen + 1 dígito verificador
    if (nit.length !== 11) {
      throw new Error('NIT deve ter exatamente 9 dígitos + hífen + 1 dígito verificador');
    }
    
    const parts = nit.split('-');
    if (parts.length !== 2 || parts[0]?.length !== 9 || parts[1]?.length !== 1) {
      throw new Error('NIT deve ter exatamente 9 dígitos + hífen + 1 dígito verificador');
    }
  } else if (nit.length !== 9) {
    // Formato sem hífen: apenas 9 dígitos
    throw new Error('NIT deve ter exatamente 9 dígitos');
  }
}

/**
 * Valida o dígito verificador do NIT
 * @param nit - NIT a ser validado
 * @throws Error se o dígito verificador for inválido
 */
function validateCheckDigit(nit: string): void {
  const parts = nit.split('-');
  const digits = parts[0];
  const checkDigit = parts[1];
  
  if (digits === undefined || checkDigit === undefined) {
    throw new Error('NIT deve ter formato válido: 9 dígitos + hífen + dígito verificador');
  }
  
  const calculatedCheckDigit = calculateCheckDigit(digits);
  
  if (checkDigit !== calculatedCheckDigit) {
    throw new Error('Dígito verificador do NIT inválido');
  }
}

/**
 * Calcula o dígito verificador do NIT colombiano
 * @param digits - 9 dígitos do NIT
 * @returns Dígito verificador calculado
 */
function calculateCheckDigit(digits: string): string {
  // Algoritmo oficial do NIT colombiano (DIAN)
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    const digit = digits[i];
    const weight = weights[i];
    if (digit !== undefined && weight !== undefined) {
      sum += Number.parseInt(digit, 10) * weight;
    }
  }
  
  const remainder = sum % 11;
  return remainder < 2 ? remainder.toString() : (11 - remainder).toString();
}
