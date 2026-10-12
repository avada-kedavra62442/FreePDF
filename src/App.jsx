import React, { useEffect, useState } from "react";
import { TOOL_ROUTES, ROUTE_TO_MODE, VALID_MODES } from "./config/routes";
import HomePage from "./components/pages/HomePage";
import UnknownRoute from "./components/pages/UnknownRoute";
import { TOOLS, FAQS } from "./data/toolData";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ToolPage from "./components/pages/ToolPage";
import InstallFreePDF from "./components/pwa/InstallFreePDF";
import { navigate } from "./lib/navigation";
import "./styles.css";

/* ============================================================
   FREEPDF ROUTING
   ============================================================ */

/* ============================================================
   TOOL DATA
   ============================================================ */

/* ============================================================
   SHARED HEADER
   ============================================================ */

/* ============================================================
   SHARED FOOTER
   ============================================================ */

/* ============================================================
   TOOL PAGE
   ============================================================ */

/* ============================================================
   PWA INSTALL
   ============================================================ */

/* ============================================================
   HOME PAGE
   ============================================================ */

export default function App() {
  const getPath = () =>
    window.location.pathname || "/";

  const [path, setPath] =
    useState(getPath);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getPath());

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  useEffect(() => {
    const siteUrl = "https://free-pdf-delta.vercel.app";
    const seoByPath = {
      "/": {
        title: "FreePDF — Free PDF Tools, Free Forever",
        description: "Merge, split and compress PDFs with FreePDF. Free browser-based PDF tools with no ads, no watermarks and no forced account.",
      },
      "/workspace": {
        title: "Free PDF Workspace — FreePDF",
        description: "Open FreePDF's free online PDF workspace and choose a tool for common PDF tasks.",
      },
      "/merge": {
        title: "Merge PDF Files Online Free — FreePDF",
        description: "Combine multiple PDF files into one document with FreePDF. A free, simple PDF merger with no watermarks.",
      },
      "/split": {
        title: "Split PDF Pages Online Free — FreePDF",
        description: "Split a PDF into separate pages or selected page ranges with FreePDF's free online PDF splitter.",
      },
      "/compress": {
        title: "Compress PDF Online Free — FreePDF",
        description: "Reduce PDF file size with FreePDF's free PDF compressor. Prepare smaller PDFs for sharing.",
      },
      "/pdf-to-image": {
        title: "Convert PDF to JPG or PNG Free — FreePDF",
        description: "Turn PDF pages into JPG or PNG images with FreePDF's free PDF-to-image tool.",
      },
      "/image-to-pdf": {
        title: "Convert JPG or PNG to PDF Free — FreePDF",
        description: "Combine JPG or PNG images into a PDF document with FreePDF's free image-to-PDF converter.",
      },
      "/sign": {
        title: "Sign PDF Online Free — FreePDF",
        description: "Add a signature to your PDF with FreePDF's free online PDF signing tool.",
      },
      "/password-protect": {
        title: "Password Protect a PDF Free — FreePDF",
        description: "Protect a PDF with a password using FreePDF's PDF protection tool.",
      },
      "/metadata": {
        title: "Edit PDF Metadata Online Free — FreePDF",
        description: "Edit PDF document metadata such as title, author, subject and keywords with FreePDF.",
      },
    };
    const seo = seoByPath[path] || {
      title: "Page Not Found — FreePDF",
      description: "This FreePDF page could not be found. Return to FreePDF to explore free PDF tools.",
    };
    document.title = seo.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", seo.description);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", siteUrl + (path === "/" ? "/" : path));

    const setMeta = (selector, attribute, key, value) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", value);
    };
    setMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    setMeta('meta[property="og:description"]', "property", "og:description", seo.description);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", siteUrl + (path === "/" ? "/" : path));
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");

    document.documentElement.lang = "en";
  }, [path]);

  /* Home */

  if (path === "/") {
    return <HomePage />;
  }

  /* Known tool routes */

  const mode =
    ROUTE_TO_MODE[path];

  if (
    mode &&
    VALID_MODES.has(mode)
  ) {
    return (
      <ToolPage mode={mode} />
    );
  }

  /*
    Unknown routes are redirected to the
    FreePDF workspace instead of rendering
    a broken/empty page.
  */

  return (
    <UnknownRoute
      onGoHome={() =>
        navigate("/")
      }
      onGoTools={() =>
        navigate("/workspace")
      }
    />
  );
}

/* ============================================================
   UNKNOWN ROUTE
   ============================================================ */
