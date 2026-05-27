// skillAtlasInteractions.ts: progressive enhancement for the skill atlas radar.
// Wires axis controls + radar points to a detail panel via data-* attributes.
// No third-party dependencies.

export function initSkillAtlas(root: ParentNode = document): void {
  const radar = root.querySelector<HTMLElement>("[data-skill-radar]");
  const panel = root.querySelector<HTMLElement>("[data-skill-detail]");
  if (!radar || !panel) return;

  const controls = Array.from(
    radar.querySelectorAll<HTMLButtonElement>("[data-axis-control]"),
  );
  const points = Array.from(
    radar.querySelectorAll<SVGElement>("[data-skill-radar-point]"),
  );
  const labels = Array.from(
    radar.querySelectorAll<SVGElement>("[data-axis-label]"),
  );
  const panels = Array.from(
    panel.querySelectorAll<HTMLElement>("[data-axis-panel]"),
  );

  function activate(index: number, scrollToPanel = false): void {
    let activePanel: HTMLElement | null = null;

    for (const c of controls) {
      const i = Number(c.dataset.axisIndex);
      c.setAttribute("aria-pressed", i === index ? "true" : "false");
    }
    for (const p of points) {
      const i = Number(p.dataset.axisIndex);
      if (i === index) p.setAttribute("data-active", "true");
      else p.removeAttribute("data-active");
    }
    for (const l of labels) {
      const i = Number(l.dataset.axisIndex);
      if (i === index) l.setAttribute("data-active", "true");
      else l.removeAttribute("data-active");
    }
    for (const pan of panels) {
      const i = Number(pan.dataset.axisIndex);
      pan.hidden = i !== index;
      if (i === index) activePanel = pan;
    }

    if (scrollToPanel && activePanel) {
      activePanel.scrollIntoView({ block: "start", behavior: "smooth" });
      activePanel.focus({ preventScroll: true });
    }
  }

  for (const control of controls) {
    control.addEventListener("click", () => {
      activate(Number(control.dataset.axisIndex), true);
    });
    control.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const current = Number(control.dataset.axisIndex);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = (current + delta + controls.length) % controls.length;
      controls[next].focus();
      activate(next);
    });
  }

  for (const point of points) {
    point.addEventListener("click", () => {
      activate(Number(point.dataset.axisIndex), true);
    });
  }

  activate(0);
}
