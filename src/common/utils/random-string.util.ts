import { randomInt } from 'crypto';

export const randomNumericCode = (length = 6): string => {
  return randomInt(0, 1_000_000).toString().padStart(length, '0');
};

export const randomString = (length = 8): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?/|`~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[randomInt(0, characters.length)];
  }
  return result;
};

export const generatePassword = (length = 8): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}<>?/|~';

  const allChars = upper + lower + digits + special;

  const result: string[] = [
    upper[randomInt(0, upper.length)],
    lower[randomInt(0, lower.length)],
    digits[randomInt(0, digits.length)],
    special[randomInt(0, special.length)]
  ];

  for (let i = result.length; i < length; i++) {
    result.push(allChars[randomInt(0, allChars.length)]);
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
};
