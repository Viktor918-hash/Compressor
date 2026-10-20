import { useTranslation } from "react-i18next";
import { FiSliders } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import {
  PRESET_PAGES,
  PRESET_PAGE_GROUPS,
  presetPageUkPath,
} from "../../presets/presetPages";
import { presetPageIcon } from "./presetPageIcons";

/**
 * "Добірки пресетів" — навігація між усіма тематичними сторінками пресетів
 * (сюжети / сезони й стилі / під задачу). Показується на головній
 * /photo-presets і на кожній підсторінці: звичайні посилання, тож це й
 * внутрішня перелінковка для пошуковиків.
 */
const PresetCollections = ({ currentSlug = null }) => {
  const { t } = useTranslation();

  return (
    <nav className="preset-collections" aria-labelledby="preset-collections-title">
      <h2 className="preset-collections__title" id="preset-collections-title">
        {t("presetPages.ui.collectionsTitle")}
      </h2>
      {PRESET_PAGE_GROUPS.map((group) => (
        <div className="preset-collections__group" key={group}>
          <span className="preset-collections__group-title">
            {t(`presetPages.groups.${group}`)}
          </span>
          <ul className="preset-collections__list">
            {PRESET_PAGES.filter((p) => p.group === group).map((page) => {
              const Icon = presetPageIcon(page);
              const isCurrent = page.slug === currentSlug;
              return (
                <li key={page.slug}>
                  <LocalizedLink
                    to={presetPageUkPath(page)}
                    className={`preset-collections__link${
                      isCurrent ? " preset-collections__link--current" : ""
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t(`presetPages.nav.${page.slug}`)}
                  </LocalizedLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {currentSlug && (
        <LocalizedLink to="/photo-presets" className="preset-collections__all">
          <FiSliders size={16} aria-hidden="true" />
          {t("presetPages.ui.allPresetsShort")}
        </LocalizedLink>
      )}
    </nav>
  );
};

export default PresetCollections;
