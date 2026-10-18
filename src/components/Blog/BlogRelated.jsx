import "./Blog.css";
import { FiBookOpen } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { usePageLang } from "../../hooks/usePageLang";
import { BLOG_LANGS, BLOG_UI, blogPostPath, postsForTool } from "../../blog/posts";

/**
 * «Корисне з блогу» на сторінці інструмента (round 36): посилання на
 * статті, пов'язані з цим інструментом. Блог існує лише в uk/en — у ru/es
 * блок не рендериться.
 */
const BlogRelated = ({ toolSlug }) => {
  const lang = usePageLang();
  if (!BLOG_LANGS.includes(lang)) return null;
  const posts = postsForTool(toolSlug);
  if (posts.length === 0) return null;
  const ui = BLOG_UI[lang];
  return (
    <nav className="blog-related" aria-labelledby="blog-related-title">
      <h2 className="blog-related__title" id="blog-related-title">
        {ui.fromBlog}
      </h2>
      <ul className="blog-related__list">
        {posts.map((p) => (
          <li className="blog-related__item" key={p.slug}>
            <FiBookOpen size={20} className="blog-related__icon" aria-hidden="true" />
            <LocalizedLink to={blogPostPath(p, "uk")} className="blog-related__link">
              {p[lang].h1}
            </LocalizedLink>
          </li>
        ))}
      </ul>
      <LocalizedLink to="/blog" className="blog-related__all">
        {ui.allPosts}
      </LocalizedLink>
    </nav>
  );
};

export default BlogRelated;
