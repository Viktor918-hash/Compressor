// У яких мовах обов'язковий ключ перекладу. Ключі інструмента, чий маршрут
// існує не в усіх мовах ({ slug, uk, en } без ru/es), обов'язкові лише там, де
// маршрут є: <slug>.*, seoContent.<slug>.*, header.<slug>, header.<slug>Desc.
// Усі інші ключі — в усіх мовах.
export function makeRequiredIn(routes, langs) {
  const subset = routes.filter((r) => langs.some((l) => !r[l]));
  const ownerOf = (key) =>
    subset.find(
      (r) =>
        key.startsWith(`${r.slug}.`) ||
        key.startsWith(`seoContent.${r.slug}.`) ||
        key === `header.${r.slug}` ||
        key === `header.${r.slug}Desc`
    );
  const requiredIn = (key) => {
    const owner = ownerOf(key);
    return owner ? langs.filter((l) => owner[l]) : langs;
  };
  return { ownerOf, requiredIn };
}
