export function initCareerNarrativeInteractions(): void {
  const roots = document.querySelectorAll("[data-career-narrative]");

  roots.forEach((root) => {
    const initialOpenCount = Number.parseInt(
      root.getAttribute("data-initial-open-count") || "0",
      10,
    );

    const setCompanyExpanded = (company: HTMLElement, expanded: boolean) => {
      company.dataset.expanded = expanded ? "true" : "false";
      const toggle = company.querySelector("[data-narrative-company-toggle]");
      const panel = company.querySelector(".expandable-detail");

      if (toggle instanceof HTMLButtonElement) {
        toggle.setAttribute("aria-expanded", String(expanded));
      }

      if (panel) {
        panel.classList.toggle("expandable-detail--open", expanded);
      }
    };

    const setProjectExpanded = (project: HTMLElement, expanded: boolean) => {
      project.dataset.expanded = expanded ? "true" : "false";
      const toggle = project.querySelector("[data-narrative-project-toggle]");
      const panel = project.querySelector(".expandable-detail");

      if (toggle instanceof HTMLButtonElement) {
        toggle.setAttribute("aria-expanded", String(expanded));
      }

      if (panel) {
        panel.classList.toggle("expandable-detail--open", expanded);
      }
    };

    root
      .querySelectorAll<HTMLElement>("[data-narrative-company]")
      .forEach((company, index) => {
        if (index < initialOpenCount) {
          setCompanyExpanded(company, true);
        }
      });

    root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const control = target.closest("[data-narrative-control]");
      if (control instanceof HTMLButtonElement) {
        const action = control.dataset.narrativeControl;
        if (action === "expand-all") {
          root
            .querySelectorAll<HTMLElement>("[data-narrative-company]")
            .forEach((company) => {
              setCompanyExpanded(company, true);
            });
        }

        if (action === "collapse-all") {
          root
            .querySelectorAll<HTMLElement>("[data-narrative-company]")
            .forEach((company) => {
              setCompanyExpanded(company, false);
            });
          root
            .querySelectorAll<HTMLElement>("[data-narrative-project]")
            .forEach((project) => {
              setProjectExpanded(project, false);
            });
        }
        return;
      }

      const companyToggle = target.closest("[data-narrative-company-toggle]");
      if (companyToggle instanceof HTMLButtonElement) {
        const company = companyToggle.closest("[data-narrative-company]");
        if (!(company instanceof HTMLElement)) {
          return;
        }

        setCompanyExpanded(company, company.dataset.expanded !== "true");
        return;
      }

      const projectToggle = target.closest("[data-narrative-project-toggle]");
      if (projectToggle instanceof HTMLButtonElement) {
        const project = projectToggle.closest("[data-narrative-project]");
        if (!(project instanceof HTMLElement)) {
          return;
        }

        const company = project.closest("[data-narrative-company]");
        if (company instanceof HTMLElement) {
          setCompanyExpanded(company, true);
        }

        setProjectExpanded(project, project.dataset.expanded !== "true");
      }
    });
  });
}
