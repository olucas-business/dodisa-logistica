import { useCallback, useEffect, useState } from "react";

interface SimpleRouterState {
  path: string;
  query: URLSearchParams;
  navigate: (to: string) => void;
}

export default function useSimpleRouter(): SimpleRouterState {
  const [path, setPath] = useState<string>(() => window.location.pathname);
  const [query, setQuery] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
      setQuery(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname + url.search === window.location.pathname + window.location.search) return;
    window.history.pushState({}, "", to);
    setPath(url.pathname);
    setQuery(new URLSearchParams(url.search));
  }, []);

  return { path, query, navigate };
}
