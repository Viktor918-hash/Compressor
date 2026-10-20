// Іконки тематичних сторінок пресетів (поле icon у src/presets/presetPages.js).
// Окремо від даних сторінок, бо presetPages.js імпортується в Node
// (vite.config.js) і не повинен тягнути react-icons.
import {
  FiUser,
  FiFeather,
  FiMapPin,
  FiMoon,
  FiSun,
  FiTruck,
  FiWind,
  FiCloudSnow,
  FiFilm,
  FiVideo,
  FiSunrise,
  FiShoppingBag,
  FiTag,
  FiCoffee,
  FiSmile,
  FiHeart,
  FiSliders,
} from "react-icons/fi";

export const PRESET_PAGE_ICONS = {
  user: FiUser,
  feather: FiFeather,
  mapPin: FiMapPin,
  moon: FiMoon,
  sun: FiSun,
  truck: FiTruck,
  wind: FiWind,
  snow: FiCloudSnow,
  film: FiFilm,
  video: FiVideo,
  sunrise: FiSunrise,
  bag: FiShoppingBag,
  tag: FiTag,
  coffee: FiCoffee,
  smile: FiSmile,
  heart: FiHeart,
};

export const presetPageIcon = (page) => PRESET_PAGE_ICONS[page?.icon] || FiSliders;
