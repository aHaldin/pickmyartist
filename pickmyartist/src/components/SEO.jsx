import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULTS = {
  brand: "PickMyArtist",
  baseUrl: "https://pickmyartist.com",
  title: "PickMyArtist – Get booked as a performer",
  description:
    "PickMyArtist is a free platform where performers create a profile and get discovered by venues, bookers and event clients.",
  robots: "index, follow",
  ogType: "website",
  ogImage: "https://pickmyartist.com/og-image.png",
  twitterCard: "summary_large_image",
};

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const joinUrl = (base, path) => {
  if (!path) return base;
  if (isAbsoluteUrl(path)) return path;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const setMetaTag = ({ name, property, content }) => {
  if (!content) return;
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (name) tag.setAttribute("name", name);
    if (property) tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const setLinkTag = ({ rel, href }) => {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

export default function SEO({
  title,
  description,
  robots,
  canonical,
  ogTitle,
  ogDescription,
  ogType,
  ogUrl,
  ogImage,
  twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage,
}) {
  const location = useLocation();

  const resolvedTitle = title || DEFAULTS.title;
  const resolvedDescription = description || DEFAULTS.description;
  const resolvedRobots = robots || DEFAULTS.robots;
  const resolvedCanonical = joinUrl(
    DEFAULTS.baseUrl,
    canonical || location.pathname
  );
  const resolvedOgTitle = ogTitle || resolvedTitle;
  const resolvedOgDescription = ogDescription || resolvedDescription;
  const resolvedOgType = ogType || DEFAULTS.ogType;
  const resolvedOgUrl = ogUrl || resolvedCanonical;
  const resolvedOgImage = ogImage || DEFAULTS.ogImage;
  const resolvedTwitterCard = twitterCard || DEFAULTS.twitterCard;
  const resolvedTwitterTitle = twitterTitle || resolvedTitle;
  const resolvedTwitterDescription = twitterDescription || resolvedDescription;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;

  useEffect(() => {
    document.title = resolvedTitle;

    setMetaTag({ name: "description", content: resolvedDescription });
    setMetaTag({ name: "robots", content: resolvedRobots });
    setLinkTag({ rel: "canonical", href: resolvedCanonical });

    setMetaTag({ property: "og:title", content: resolvedOgTitle });
    setMetaTag({ property: "og:description", content: resolvedOgDescription });
    setMetaTag({ property: "og:type", content: resolvedOgType });
    setMetaTag({ property: "og:url", content: resolvedOgUrl });
    setMetaTag({ property: "og:image", content: resolvedOgImage });

    setMetaTag({ name: "twitter:card", content: resolvedTwitterCard });
    setMetaTag({ name: "twitter:title", content: resolvedTwitterTitle });
    setMetaTag({
      name: "twitter:description",
      content: resolvedTwitterDescription,
    });
    setMetaTag({ name: "twitter:image", content: resolvedTwitterImage });
  }, [
    resolvedTitle,
    resolvedDescription,
    resolvedRobots,
    resolvedCanonical,
    resolvedOgTitle,
    resolvedOgDescription,
    resolvedOgType,
    resolvedOgUrl,
    resolvedOgImage,
    resolvedTwitterCard,
    resolvedTwitterTitle,
    resolvedTwitterDescription,
    resolvedTwitterImage,
  ]);

  return null;
}
