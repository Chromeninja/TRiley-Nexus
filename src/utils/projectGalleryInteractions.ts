export function initProjectGalleryInteractions(): void {
  const galleries = document.querySelectorAll<HTMLElement>("[data-project-gallery]");

  galleries.forEach((gallery) => {
    const viewport = gallery.querySelector<HTMLElement>("[data-gallery-viewport]");
    const slides = Array.from(gallery.querySelectorAll<HTMLElement>("[data-gallery-slide]"));
    const dots = Array.from(gallery.querySelectorAll<HTMLButtonElement>("[data-gallery-dot]"));
    const prevBtn = gallery.querySelector<HTMLButtonElement>("[data-gallery-prev]");
    const nextBtn = gallery.querySelector<HTMLButtonElement>("[data-gallery-next]");

    if (!viewport || slides.length <= 1) {
      return;
    }

    let currentIndex = 0;
    let scrollFrame = 0;
    let autoAdvanceId: number | undefined;
    let isPaused = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const MIN_SWIPE_DISTANCE = 40;
    const MAX_VERTICAL_DRIFT = 80;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const syncActiveVideo = () => {
      slides.forEach((slide, slideIndex) => {
        const video = slide.querySelector("video");
        if (!video) {
          return;
        }

        if (slideIndex === currentIndex) {
          void video.play().catch(() => {
            // Browser autoplay policy may still block playback until interaction.
          });
        } else if (!video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    const syncUi = () => {
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");

        if (isActive) {
          slide.setAttribute("aria-current", "true");
          slide.removeAttribute("inert");
        } else {
          slide.removeAttribute("aria-current");
          slide.setAttribute("inert", "");
        }
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      syncActiveVideo();
    };

    const clearAutoAdvance = () => {
      if (autoAdvanceId) {
        window.clearInterval(autoAdvanceId);
        autoAdvanceId = undefined;
      }
    };

    const startAutoAdvance = () => {
      clearAutoAdvance();

      if (prefersReducedMotion || isPaused) {
        return;
      }

      autoAdvanceId = window.setInterval(() => {
        scrollToIndex((currentIndex + 1) % slides.length);
      }, 5000);
    };

    const scrollToIndex = (index: number) => {
      currentIndex = Math.max(0, Math.min(index, slides.length - 1));
      viewport.scrollTo({
        left: slides[currentIndex]?.offsetLeft ?? 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      syncUi();
      startAutoAdvance();
    };

    const syncIndexFromScroll = () => {
      const slideWidth = viewport.clientWidth;
      if (slideWidth === 0) {
        return;
      }

      const nextIndex = Math.round(viewport.scrollLeft / slideWidth);
      const boundedIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));

      if (boundedIndex !== currentIndex) {
        currentIndex = boundedIndex;
        syncUi();
      }
    };

    prevBtn?.addEventListener("click", () => {
      scrollToIndex((currentIndex - 1 + slides.length) % slides.length);
    });
    nextBtn?.addEventListener("click", () => {
      scrollToIndex((currentIndex + 1) % slides.length);
    });

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => scrollToIndex(index));
    });

    viewport.addEventListener("scroll", () => {
      if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
      }

      scrollFrame = window.requestAnimationFrame(syncIndexFromScroll);
    });

    viewport.addEventListener(
      "touchstart",
      (event: TouchEvent) => {
        const touch = event.changedTouches[0];
        if (!touch) {
          return;
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isPaused = true;
        clearAutoAdvance();
      },
      { passive: true },
    );

    viewport.addEventListener(
      "touchend",
      (event: TouchEvent) => {
        const touch = event.changedTouches[0];
        if (!touch) {
          return;
        }

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const horizontalDistance = Math.abs(deltaX);
        const verticalDistance = Math.abs(deltaY);

        isPaused = false;

        if (
          horizontalDistance >= MIN_SWIPE_DISTANCE &&
          verticalDistance <= MAX_VERTICAL_DRIFT &&
          horizontalDistance > verticalDistance
        ) {
          if (deltaX < 0) {
            scrollToIndex((currentIndex + 1) % slides.length);
            return;
          }

          scrollToIndex((currentIndex - 1 + slides.length) % slides.length);
          return;
        }

        startAutoAdvance();
      },
      { passive: true },
    );

    gallery.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex((currentIndex - 1 + slides.length) % slides.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex((currentIndex + 1) % slides.length);
      }
    });

    gallery.addEventListener("pointerenter", () => {
      isPaused = true;
      clearAutoAdvance();
    });

    gallery.addEventListener("pointerleave", () => {
      isPaused = false;
      startAutoAdvance();
    });

    gallery.addEventListener("focusin", () => {
      isPaused = true;
      clearAutoAdvance();
    });

    gallery.addEventListener("focusout", (event: FocusEvent) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && gallery.contains(nextTarget)) {
        return;
      }

      isPaused = false;
      startAutoAdvance();
    });

    window.addEventListener("resize", syncIndexFromScroll);

    syncUi();
    startAutoAdvance();
  });
}
