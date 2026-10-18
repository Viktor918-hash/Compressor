import "./Blog.css";
import { FiArrowRight, FiClock } from "react-icons/fi";
import SeoHead from "../Seo/SeoHead";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import {
  BLOG_INDEX,
  BLOG_INDEX_SLUG,
  BLOG_POSTS,
  BLOG_UI,
  blogPostPath,
  formatBlogDate,
  readingMinutes,
} from "../../blog/posts";

const SITE_URL = "https://compressphoto.org";

/** /blog, /en/blog — список статей (round 36) */
const BlogIndex = () => {
  const lang = usePageLang() === "en" ? "en" : "uk";
  const route = ROUTES.find((r) => r.slug === BLOG_INDEX_SLUG);
  const c = BLOG_INDEX[lang];
  const ui = BLOG_UI[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: c.h1,
    description: c.description,
    inLanguage: lang,
    url: `${SITE_URL}${route[lang]}`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    blogPost: BLOG_POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p[lang].h1,
      url: `${SITE_URL}${blogPostPath(p, lang)}`,
      datePublished: p.published,
    })),
  };

  return (
    <>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <main className="blog container">
        <header className="blog-index__head">
          <h1 className="blog-index__title">{c.h1}</h1>
          <p className="blog-index__intro">{c.intro}</p>
        </header>
        <ul className="blog-index__list">
          {BLOG_POSTS.map((p) => (
            <li key={p.slug} className="blog-card">
              <h2 className="blog-card__title">
                <LocalizedLink to={blogPostPath(p, "uk")} className="blog-card__link">
                  {p[lang].h1}
                </LocalizedLink>
              </h2>
              <p className="blog-card__desc">{p[lang].description}</p>
              <p className="blog-card__meta">
                <time dateTime={p.published}>{formatBlogDate(p.published, lang)}</time>
                <span aria-hidden="true">·</span>
                <span className="blog-post__read">
                  <FiClock aria-hidden="true" /> {ui.minRead(readingMinutes(p, lang))}
                </span>
              </p>
              <span className="blog-card__more" aria-hidden="true">
                {ui.readMore} <FiArrowRight />
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
};

export default BlogIndex;
