import { RESPONSE_MESSAGES } from './response-message.constant';

const createMessageESMap = (
  obj: Record<string, { message: string; code: string }>
): Map<string, string> => {
  return new Map(Object.entries(obj).map(([, { message, code }]) => [message, code]));
};

export const RESPONSE_MESSAGES_MAP = createMessageESMap(RESPONSE_MESSAGES);
