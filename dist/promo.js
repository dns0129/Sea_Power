const label = document.querySelector("[data-sheet-label]");
const sections = [...document.querySelectorAll("[data-sheet]")];
const links = [...document.querySelectorAll("[data-nav]")];

function show(sheet) {
  if (!label) return;
  label.hidden = false;
  label.textContent = sheet;
  for (const link of links) {
    if (link.dataset.nav === sheet) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

if (label && sections.length && "IntersectionObserver" in window) {
  const seen = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) seen.set(entry.target, entry.intersectionRatio);
      else seen.delete(entry.target);
    }
    const current = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
    if (current) show(current[0].dataset.sheet);
  }, { rootMargin: "-18% 0px -50% 0px", threshold: [0, 0.2, 0.45, 0.7] });
  for (const section of sections) observer.observe(section);
  show(sections[0].dataset.sheet);
}
