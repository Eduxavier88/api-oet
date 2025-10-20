/**
 * @purpose Decorator customizado para validação de NIT colombiano
 * @why Integrar validação NIT com class-validator
 * @collaborators CreateIncidentDto
 * @inputs Valor do campo NIT
 * @outputs Resultado da validação
 * @sideEffects Nenhum
 * @errors Retorna erro de validação se NIT inválido
 * @examples @IsNitColombia()
 */

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { validateNitColombia } from './nit-colombia.validator';

/**
 * Decorator para validação de NIT colombiano
 * @param validationOptions - Opções de validação do class-validator
 */
export function IsNitColombia(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNitColombia',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      validator: {
        validate(value: any, _args: ValidationArguments) {
          try {
            validateNitColombia(value);
            return true;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(_args: ValidationArguments) {
          return 'NIT deve ter formato válido colombiano: 9 dígitos + hífen + dígito verificador';
        }
      }
    });
  };
}
