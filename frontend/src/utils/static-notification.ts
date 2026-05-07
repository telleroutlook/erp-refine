import type { MessageInstance } from 'antd/es/message/interface';

let _message: MessageInstance | null = null;

export function setStaticMessage(api: MessageInstance) {
  _message = api;
}

export function staticMessage(): MessageInstance | null {
  return _message;
}
