import "./Blog.css";
import { FiArrowRight, FiClock } from "react-icons/fi";
import SeoHead from "../Seo/SeoHead";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import {
  BLOG_POSTS,
  BLOG_UI,
  blogPostBySlug,
  blogPostPath,
  formatBlogDate,
  readingMinutes,
} from "../../blog/posts";
import { renderInline } from "./inline";

const SITE_URL = "https://compressphoto.org";

/**
 * Стаття блогу (round 36). Контент — у src/blog/posts.js (uk/en).
 * Розмітка: BlogPosting + BreadcrumbList «Головна → Блог → Стаття».
 */
const BlogPost = ({ slug }) => {
  const lang = usePageLang() === "en" ? "en" : "uk";
  const post = blogPostBySlug(slug);
  const route = ROUTES.find((r) => r.slug === slug);
  if (!post || !route) return null;
  const c = post[lang];
  const ui = BLOG_UI[lang];
  const url = `${SITE_URL}${blogPostPath(post, lang)}`;
  const others = BLOG_POSTS.filter((p) => p.slug !== slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: c.h1,
      description: c.description,
      inLanguage: lang,
      datePublished: post.published,
      dateModified: post.updated || post.published,
      mainEntityOfPage: url,
      url,
      image: `${SITE_URL}/og/og-${lang}.png`,
      author: { "@type": "Organization", name: "CompressPhoto", url: `${SITE_URL}/` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "CompressPhoto", item: `${SITE_URL}${lang === "uk" ? "/" : "/en"}` },
        { "@type": "ListItem", position: 2, name: ui.blog, item: `${SITE_URL}${lang === "uk" ? "/blog" : "/en/blog"}` },
        { "@type": "ListItem", position: 3, name: c.h1, item: url },
      ],
    },
  ];

  return (
    <>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <main className="blog container">
        <article className="blog-post">
          <nav className="blog-crumbs" aria-label="breadcrumb">
            <LocalizedLink to="/">{ui.home}</LocalizedLink>
            <span aria-hidden="true">›</span>
            <LocalizedLink to="/blog">{ui.blog}</LocalizedLink>
          </nav>
          <h1 className="blog-post__title">{c.h1}</h1>
          <p className="blog-post__meta">
            <time dateTime={post.published}>
              {ui.published} {formatBlogDate(post.published, lang)}
            </time>
            <span aria-hidden="true">·</span>
            <span className="blog-post__read">
              <FiClock aria-hidden="true" /> {ui.minRead(readingMinutes(post, lang))}
            </span>
          </p>

          {c.lead.map((p, i) => (
            <p className="blog-post__lead" key={i}>
              {renderInline(p, `lead${i}-`)}
            </p>
          ))}

          {c.sections.map((s, i) => (
            <section className="blog-post__section" key={s.heading}>
              <h2 className="blog-post__h2">{s.heading}</h2>
              {s.paragraphs?.map((p, j) => (
                <p className="blog-post__p" key={j}>
                  {renderInline(p, `s${i}p${j}-`)}
                </p>
              ))}
              {s.steps && (
                <ol className="blog-post__steps">
                  {s.steps.map((step, j) => (
                    <li key={j}>{renderInline(step, `s${i}st${j}-`)}</li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          <aside className="blog-cta">
            <LocalizedLink to={post.tool} className="blog-cta__btn">
              {c.cta.text}
              <FiArrowRight aria-hidden="true" />
            </LocalizedLink>
            <p className="blog-cta__sub">{c.cta.sub}</p>
          </aside>

          <section className="blog-post__section">
            <h2 className="blog-post__h2">{ui.faq}</h2>
            <div className="blog-faq">
              {c.faq.map((f, i) => (
                <div className="blog-faq__item" key={f.q}>
                  <h3 className="blog-faq__q">{f.q}</h3>
                  <p className="blog-faq__a">{renderInline(f.a, `faq${i}-`)}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <nav className="blog-others" aria-label={ui.otherPosts}>
          <h2 className="blog-others__title">{ui.otherPosts}</h2>
          <ul className="blog-others__list">
            {others.map((p) => (
              <li key={p.slug}>
                <LocalizedLink to={blogPostPath(p, "uk")} className="blog-others__link">
                  {p[lang].h1}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
};

export default BlogPost;
