/**
 * Створює помилку, текст якої безпечно показувати користувачу
 * (Panel показує message лише для помилок з userFacing: true).
 */
export function userError(message, extra = {}) {
  const error = new Error(message);
  error.userFacing = true;
  Object.assign(error, extra);
  return error;
}
