import { useRef, useState, useCallback, useEffect } from "react";
import "./Beforeafterslider.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";

/**
 * Слайдер "до / після". Передайте URL зображення "до" і "після" —
 * обидва мають бути одного розміру/пропорцій для коректного накладання.
 */
const BeforeAfterSlider = ({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50); // % зліва направо
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    if (e.touches) e.preventDefault();
    updateFromClientX(e.clientX ?? e.touches?.[0]?.clientX);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      if (e.touches) e.preventDefault();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX != null) updateFromClientX(clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false }); // важливо!
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      className="ba-slider"
      ref={containerRef}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      <img
        src={afterSrc}
        alt={afterLabel || "after"}
        className="ba-slider__img ba-slider__img--after"
        draggable={false}
      />

      <img
        src={beforeSrc}
        alt={beforeLabel || "before"}
        className="ba-slider__img ba-slider__img--before"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      <div className="ba-slider__handle" style={{ left: `${position}%` }}>
        <div className="ba-slider__handle-grip">
          <FiChevronLeft size={14} />
          <FiChevronRight size={14} />
        </div>
      </div>

      <span className="ba-slider__badge ba-slider__badge--before">
        {beforeLabel || t("presets.before", "до")}
      </span>
      <span className="ba-slider__badge ba-slider__badge--after">
        {afterLabel || t("presets.after", "після")}
      </span>
    </div>
  );
};

export default BeforeAfterSlider;
