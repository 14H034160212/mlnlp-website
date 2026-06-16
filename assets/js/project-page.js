(function () {
    "use strict";

    if (!document.body.classList.contains("project-page")) {
        return;
    }

    document.body.classList.add("project-page--enhanced");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showStatic() {
        document.querySelectorAll("#project-title, .project-card").forEach((element) => {
            element.classList.add("is-visible");
            element.style.removeProperty("--project-delay");
        });
    }

    function initReveal() {
        const title = document.querySelector("#project-title");
        const cards = document.querySelectorAll(".project-card");

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            showStatic();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const target = entry.target;
                target.classList.add("is-visible");
                observer.unobserve(target);
            });
        }, {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px"
        });

        if (title) {
            observer.observe(title);
        }

        cards.forEach((card, index) => {
            card.style.setProperty("--project-delay", `${index * 80}ms`);
            observer.observe(card);
        });
    }

    function formatCount(value) {
        const number = Number(value) || 0;
        if (number >= 1000) {
            return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
        }
        return `${number}`;
    }

    function hydrateForks() {
        const forkBadges = document.querySelectorAll("[data-forks-repo]");

        forkBadges.forEach(async (badge) => {
            const repo = badge.getAttribute("data-forks-repo");
            const count = badge.querySelector("[data-forks-count]");

            if (!repo || !count) {
                return;
            }

            const cacheKey = `mlnlp:forks:${repo}`;
            const cachedValue = window.sessionStorage.getItem(cacheKey);
            if (cachedValue) {
                count.textContent = cachedValue;
                return;
            }

            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`);
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const formattedCount = formatCount(data.forks_count);
                window.sessionStorage.setItem(cacheKey, formattedCount);
                count.textContent = formattedCount;
            } catch (error) {
                // Leave the fallback value when GitHub is unavailable or rate-limited.
            }
        });
    }

    function waitForProjects() {
        const container = document.querySelector("#project-container-data");

        if (!container) {
            initReveal();
            return;
        }

        if (container.querySelector(".project-card")) {
            hydrateForks();
            initReveal();
            return;
        }

        let didInit = false;
        let fallbackTimer = null;
        const startReveal = () => {
            if (didInit) {
                return;
            }

            didInit = true;
            observer.disconnect();
            if (fallbackTimer) {
                window.clearTimeout(fallbackTimer);
            }
            hydrateForks();
            initReveal();
        };

        const observer = new MutationObserver(() => {
            if (container.querySelector(".project-card")) {
                startReveal();
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });

        fallbackTimer = window.setTimeout(startReveal, 2500);
    }

    window.addEventListener("load", waitForProjects);
})();
