import ConvertVideoFormat from "./ConvertVideoFormat";

// /convert-webm-to-mp4 — вузька SEO-сторінка під запит "webm to mp4"
// (LOW конкуренція — claude/compressphoto-growth-prompt.md §3.3-А).
// Приймає лише .webm — не будь-яке відео.
const ConvertWebmToMp4 = () => (
  <ConvertVideoFormat
    routeSlug="convertWebmToMp4"
    i18nKey="convertWebmToMp4"
    toolType="convert-webm-to-mp4"
    expectedExt="webm"
    acceptedTypes={{
      "video/webm": [".webm"],
      "": [".webm"],
    }}
  />
);

export default ConvertWebmToMp4;
