export function navigate(path) {
  if (!path) return;

  if (window.location.pathname === path) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    return;
  }

  window.history.pushState({}, "", path);

  window.dispatchEvent(
    new PopStateEvent("popstate")
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

