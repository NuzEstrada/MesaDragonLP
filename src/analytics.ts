type AnalyticsParams = Record<string, string | number | boolean | undefined>;

type TrackedSection = {
  element: Element;
  name: string;
  ratio: number;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

let sourceTracked = false;

function sendAnalyticsEvent(event: string, params: AnalyticsParams = {}) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}

function getSourceDetails(): AnalyticsParams {
  const search = new URLSearchParams(window.location.search);
  const referrerHost = document.referrer ? new URL(document.referrer, window.location.href).hostname : "";
  const clickSource = search.has("fbclid")
    ? "facebook"
    : search.has("ttclid")
      ? "tiktok"
      : search.has("gclid")
        ? "google"
        : "";
  const utmSource = search.get("utm_source")?.slice(0, 100);
  const rawSource = utmSource?.toLowerCase() || referrerHost.toLowerCase() || clickSource;
  const sourceApp = /instagram|instagr\.am/.test(rawSource)
    ? "instagram"
    : /tiktok/.test(rawSource)
      ? "tiktok"
      : /facebook|fb\.com|fbclid/.test(rawSource)
        ? "facebook"
        : /whatsapp|wa\.me/.test(rawSource)
          ? "whatsapp"
          : /google/.test(rawSource)
            ? "google"
            : rawSource || "direct";

  return {
    source_app: sourceApp,
    referrer_host: referrerHost || undefined,
    utm_source: utmSource || undefined,
    utm_medium: search.get("utm_medium")?.slice(0, 100) || undefined,
    utm_campaign: search.get("utm_campaign")?.slice(0, 100) || undefined,
  };
}

function getSectionName(element: Element) {
  return element.getAttribute("data-analytics-section") || element.id || "seccion";
}

function getInteractiveLabel(element: Element) {
  const label =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent?.replace(/\s+/g, " ").trim();
  return label?.slice(0, 100) || "sin_etiqueta";
}

export function initializeAnalyticsTracking() {
  if (!sourceTracked) {
    sendAnalyticsEvent("traffic_source_details", getSourceDetails());
    sourceTracked = true;
  }

  const trackedSections = new Map<Element, TrackedSection>();
  const getCurrentSection = () => {
    const candidates = [...trackedSections.values()].filter((section) => section.ratio > 0);
    const modal = candidates.find((section) => section.element.matches(".sheet"));
    return modal || candidates.sort((a, b) => b.ratio - a.ratio)[0] || null;
  };

  let activeSection: TrackedSection | null = null;
  let activeSince = 0;
  let pageVisible = !document.hidden;

  const changeActiveSection = (next: TrackedSection | null) => {
    if (activeSection?.element === next?.element && activeSection?.name === next?.name) return;

    const now = performance.now();
    if (activeSection && pageVisible) {
      const durationSeconds = Math.round((now - activeSince) / 1000);
      if (durationSeconds > 0) {
        sendAnalyticsEvent("section_engagement", {
          section_name: activeSection.name,
          engagement_seconds: durationSeconds,
        });
      }
    }

    activeSection = next ? { ...next } : null;
    activeSince = now;
    if (next && pageVisible) {
      sendAnalyticsEvent("section_view", { section_name: next.name });
    }
  };

  const refreshActiveSection = () => {
    changeActiveSection(pageVisible ? getCurrentSection() : null);
  };

  const updateTrackedSections = () => {
    document.querySelectorAll("[data-analytics-section], main section").forEach((element) => {
      if (!trackedSections.has(element)) {
        trackedSections.set(element, { element, name: getSectionName(element), ratio: 0 });
        intersectionObserver.observe(element);
      } else {
        const section = trackedSections.get(element)!;
        const updatedName = getSectionName(element);
        if (section.name !== updatedName) {
          section.name = updatedName;
          refreshActiveSection();
        }
      }
    });

    for (const element of trackedSections.keys()) {
      if (!element.isConnected) {
        intersectionObserver.unobserve(element);
        trackedSections.delete(element);
      }
    }
    refreshActiveSection();
  };

  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const section = trackedSections.get(entry.target);
      if (section) section.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
    }
    refreshActiveSection();
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

  const mutationObserver = new MutationObserver(updateTrackedSections);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-analytics-section"],
  });
  updateTrackedSections();

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const interactive = target.closest("button, a, [role='button']");
    if (!interactive || interactive.hasAttribute("disabled")) return;

    const section = interactive.closest("[data-analytics-section], main section");
    const href = interactive instanceof HTMLAnchorElement ? interactive.getAttribute("href") : null;
    const destination = href?.startsWith("#")
      ? href.slice(1)
      : href
        ? new URL(href, window.location.href).hostname
        : undefined;

    sendAnalyticsEvent(interactive.matches("a") ? "link_click" : "button_click", {
      button_label: getInteractiveLabel(interactive),
      section_name: section ? getSectionName(section) : "header",
      destination,
    });
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      changeActiveSection(null);
      pageVisible = false;
      return;
    }

    pageVisible = true;
    refreshActiveSection();
  };

  document.addEventListener("click", handleClick, true);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  const handlePageHide = () => changeActiveSection(null);
  window.addEventListener("pagehide", handlePageHide);

  return () => {
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    mutationObserver.disconnect();
    intersectionObserver.disconnect();
    changeActiveSection(null);
  };
}

export function trackBookingRequest(peopleCount: number, selectedGameCount: number) {
  sendAnalyticsEvent("booking_request_sent", {
    people_count: peopleCount,
    selected_game_count: selectedGameCount,
  });
}
