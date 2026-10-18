import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlay, FiScissors } from "react-icons/fi";
import { clampRange, formatClock, parseClock } from "../../utils/ffmpeg/ffmpegArgs";
import { probeMedia } from "../../utils/ffmpeg/ffmpegClient";

/**
 * Вибір фрагмента для одного відео (round 36): прев'ю, два повзунки,
 * точний час текстом, «з поточного моменту», перегляд фрагмента.
 * Якщо браузер не вміє показати відео (MKV, HEVC у Chrome тощо) —
 * тривалість визначаємо через ffmpeg, а прев'ю ховаємо.
 */
const TrimControls = ({ file, value, onChange, onConfirm, precise, onPreciseChange }) => {
  const { t } = useTranslation();
  const hintId = useId();
  const videoRef = useRef(null);
  const stopAtRef = useRef(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState(false);
  const [drafts, setDrafts] = useState({ start: null, end: null }); // текст, який зараз вводять

  // src ставимо напряму в елемент (без setState в ефекті); Blob-URL
  // звільняємо, щойно файл чи режим прев'ю змінились
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const u = URL.createObjectURL(file);
    video.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file, previewFailed]);

  const duration = value?.duration || 0;
  const start = value?.start ?? 0;
  const end = value?.end ?? duration;

  const setRange = (s, e) => onChange(clampRange(s, e, duration));

  const onLoaded = () => {
    const d = videoRef.current?.duration;
    if (Number.isFinite(d) && d > 0) {
      if (!value?.duration) onChange({ duration: d, start: 0, end: Math.round(d * 10) / 10 });
    } else {
      onPreviewError();
    }
  };

  const onPreviewError = () => {
    if (previewFailed) return;
    setPreviewFailed(true);
    if (value?.duration) return;
    setProbing(true);
    probeMedia(file)
      .then(({ duration: d }) => {
        if (d) onChange({ duration: d, start: 0, end: Math.round(d * 10) / 10 });
        else setProbeError(true);
      })
      .catch(() => setProbeError(true))
      .finally(() => setProbing(false));
  };

  const current = () => videoRef.current?.currentTime ?? 0;

  const playFragment = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    stopAtRef.current = end;
    v.play().catch(() => {});
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v && stopAtRef.current !== null && v.currentTime >= stopAtRef.current) {
      v.pause();
      stopAtRef.current = null;
    }
  };

  const commitDraft = (which) => {
    const parsed = parseClock(drafts[which] ?? "");
    setDrafts((d) => ({ ...d, [which]: null }));
    if (parsed === null) return;
    if (which === "start") setRange(parsed, end);
    else setRange(start, parsed);
  };

  const timeField = (which, label) => (
    <label className="trim__time">
      <span className="trim__time-label">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className="trim__time-input"
        value={drafts[which] ?? formatClock(which === "start" ? start : end)}
        onChange={(e) => setDrafts((d) => ({ ...d, [which]: e.target.value }))}
        onBlur={() => commitDraft(which)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitDraft(which);
        }}
        aria-describedby={hintId}
      />
    </label>
  );

  const ready = duration > 0;
  const length = Math.max(0, end - start);

  return (
    <div className="trim">
      {!previewFailed && (
        <video
          ref={videoRef}
          className="trim__video"
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onError={onPreviewError}
          onTimeUpdate={onTimeUpdate}
        />
      )}
      {previewFailed && (
        <p className="trim__note" role="status">
          {probing
            ? t("trimVideo.probing")
            : probeError
              ? t("trimVideo.errors.unreadable")
              : t("trimVideo.noPreview")}
        </p>
      )}

      {ready && (
        <>
          <div className="trim__sliders">
            <label className="trim__slider">
              <span>{t("trimVideo.start")}</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={start}
                className="range-input"
                style={{ "--progress": `${((start / duration) * 100).toFixed(1)}%` }}
                onChange={(e) => setRange(Number(e.target.value), end)}
                aria-valuetext={formatClock(start)}
              />
            </label>
            <label className="trim__slider">
              <span>{t("trimVideo.end")}</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={end}
                className="range-input"
                style={{ "--progress": `${((end / duration) * 100).toFixed(1)}%` }}
                onChange={(e) => setRange(start, Number(e.target.value))}
                aria-valuetext={formatClock(end)}
              />
            </label>
          </div>

          <div className="trim__times">
            {timeField("start", t("trimVideo.start"))}
            {timeField("end", t("trimVideo.end"))}
          </div>
          <p className="trim__hint" id={hintId}>
            {t("trimVideo.formatHint")}
          </p>

          {!previewFailed && (
            <div className="trim__actions">
              <button type="button" className="trim__btn" onClick={() => setRange(current(), end)}>
                {t("trimVideo.setStart")}
              </button>
              <button type="button" className="trim__btn" onClick={() => setRange(start, current())}>
                {t("trimVideo.setEnd")}
              </button>
              <button type="button" className="trim__btn" onClick={playFragment}>
                <FiPlay aria-hidden="true" /> {t("trimVideo.playFragment")}
              </button>
            </div>
          )}

          <p className="trim__summary" aria-live="polite">
            {t("trimVideo.summary", {
              from: formatClock(start),
              to: formatClock(end),
              length: formatClock(length),
            })}
          </p>

          <label className="trim__precise">
            <input
              type="checkbox"
              checked={precise}
              onChange={(e) => onPreciseChange(e.target.checked)}
            />
            <span>{t("trimVideo.precise")}</span>
          </label>
          <p className="trim__hint">
            {precise ? t("trimVideo.preciseHint") : t("trimVideo.fastHint")}
          </p>

          <button
            type="button"
            className="trim__confirm"
            onClick={onConfirm}
            aria-label={t("trimVideo.confirmAria", { name: file.name })}
          >
            <FiScissors aria-hidden="true" /> {t("trimVideo.confirm")}
          </button>
        </>
      )}
    </div>
  );
};

export default TrimControls;
