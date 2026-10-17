import ConvertVideoFormat from "./ConvertVideoFormat";

// /convert-mov-to-mp4 — вузька SEO-сторінка під запит "mov to mp4"
// (60 500/міс US, LOW конкуренція — claude/compressphoto-growth-prompt.md
// §3.3-А). Приймає лише .mov — не будь-яке відео.
const ConvertMovToMp4 = () => (
  <ConvertVideoFormat
    routeSlug="convertMovToMp4"
    i18nKey="convertMovToMp4"
    toolType="convert-mov-to-mp4"
    expectedExt="mov"
    acceptedTypes={{
      "video/quicktime": [".mov"],
      // Деякі браузери (особливо мобільні) не повідомляють MIME для
      // .mov взагалі — приймаємо й за розширенням (той самий паттерн,
      // що CompressVideo.jsx).
      "": [".mov"],
    }}
  />
);

export default ConvertMovToMp4;
