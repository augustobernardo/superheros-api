import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(cpf: string): boolean {
    if (!cpf || cpf.length !== 11 || !/^\d{11}$/.test(cpf)) {
      return false;
    }

    const digits = cpf.split('').map(Number);

    const calcCheck = (base: number[]) => {
      const sum = base.reduce(
        (acc, d, i) => acc + d * (base.length + 1 - i),
        0,
      );
      const rem = (sum * 10) % 11;
      return rem === 10 ? 0 : rem;
    };

    const check1 = calcCheck(digits.slice(0, 9));
    if (check1 !== digits[9]) return false;

    const check2 = calcCheck(digits.slice(0, 10));
    if (check2 !== digits[10]) return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    void _args;
    return 'CPF is invalid';
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}
