// Фото, завантажене на одній зі сторінок пресетів, лишається доступним після
// переходу на іншу добірку (/photo-presets → /photo-presets/portrait …) у
// межах тієї самої вкладки: сторінки перемонтовуються при зміні адреси
// (ErrorBoundary з key=pathname), тож без цього довелося б щоразу обирати
// фото заново. Лише в пам'яті — нічого не зберігається на диск/сервер.
let sessionFile = null;

export const getPresetsSessionFile = () => sessionFile;

export const setPresetsSessionFile = (file) => {
  sessionFile = file || null;
};
