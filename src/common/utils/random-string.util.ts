import { randomInt } from 'crypto';

export const randomStringCaps = (length = 5) => {
  let output = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < length; i++) {
    output += characters[Math.floor(Math.random() * length)];
  }

  return output;
};

export const randomNumericCode = (length = 6): string => {
  return randomInt(0, 1_000_000).toString().padStart(length, '0');
};

export const randomString = (length = 12): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[randomInt(0, characters.length)];
  }
  return result;
};
