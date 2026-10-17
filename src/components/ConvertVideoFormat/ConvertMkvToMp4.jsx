import ConvertVideoFormat from "./ConvertVideoFormat";

// /convert-mkv-to-mp4 — вузька SEO-сторінка під запит "mkv to mp4"
// (27 100/міс US, LOW конкуренція — claude/compressphoto-growth-prompt.md
// §3.3-А). Приймає лише .mkv — не будь-яке відео.
const ConvertMkvToMp4 = () => (
  <ConvertVideoFormat
    routeSlug="convertMkvToMp4"
    i18nKey="convertMkvToMp4"
    toolType="convert-mkv-to-mp4"
    expectedExt="mkv"
    acceptedTypes={{
      "video/x-matroska": [".mkv"],
      // MKV часто приходить з порожнім/нетиповим MIME навіть на
      // десктопі — приймаємо й за розширенням (той самий паттерн, що
      // CompressVideo.jsx).
      "": [".mkv"],
    }}
  />
);

export default ConvertMkvToMp4;
