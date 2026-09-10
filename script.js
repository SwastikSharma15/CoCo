const { gsap } = window;
const { ScrollTrigger } = window;
const Lenis = window.Lenis;

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // =========================================================================
  // SCENE 1: HERO SCROLL ANIMATION & SPLIT OUTRO DOORS
  // =========================================================================
  const heroSection = document.querySelector(".hero");
  const heroBackground = document.querySelector(".hero-bg");
  const heroContent = document.querySelector(".hero-content");
  const heroRevealer = document.querySelector(".hero-revealer");
  const heroImagesWrapper = document.querySelector(".hero-images");
  const heroImages = gsap.utils.toArray(".hero-img");
  const heroOutroContent = document.querySelector(".hero-outro-content");

  // Create left and right halves for split outro text
  const heroOutroClone = heroOutroContent.cloneNode(true);
  heroOutroContent.classList.add("hero-outro-left");
  heroOutroClone.classList.add("hero-outro-right");
  heroOutroContent.parentNode.appendChild(heroOutroClone);

  // Split outro from between (center 50% / 50%)
  gsap.set(".hero-outro-left", {
    clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
  });
  gsap.set(".hero-outro-right", {
    clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)",
  });
  gsap.set(heroImagesWrapper, { scale: 1 });

  // Transition text initial setup: light background track & content below viewport
  const heroScrollTextTrack = document.querySelector(
    ".hero-scroll-text-track",
  );
  const heroScrollTextContent = document.querySelector(
    ".hero-scroll-text-content",
  );
  if (heroScrollTextTrack) {
    gsap.set(heroScrollTextTrack, { opacity: 0 });
  }
  if (heroScrollTextContent) {
    gsap.set(heroScrollTextContent, {
      yPercent: 120,
      opacity: 0,
      scale: 0.96,
    });
  }

  const heroScrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: "top top",
      end: "+=480%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // Initial title lines stagger up slightly, then fade/zoom on initial scroll
  heroScrollTimeline.to(
    ".hero-content .title-line",
    {
      yPercent: -40,
      opacity: 0.2,
      stagger: 0.04,
      duration: 0.3,
      ease: "power1.in",
    },
    0,
  );
  heroScrollTimeline.to(
    [".hero-eyebrow", ".hero-scroll-indicator"],
    { opacity: 0, yPercent: -50, duration: 0.2 },
    0,
  );

  // Background zooms from 1.5 -> 1.0
  heroScrollTimeline.to(heroBackground, { scale: 1, duration: 0.5 }, 0);

  // Revealer line grows then blooms out
  heroScrollTimeline.to(
    heroRevealer,
    {
      clipPath: "polygon(49.5% 0%, 50.5% 0%, 50.5% 100%, 49.5% 100%)",
      duration: 0.2,
    },
    0,
  );
  heroScrollTimeline.to(
    heroRevealer,
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 0.3,
    },
    0.2,
  );

  // Revealer text appears in sync as revealer opens, then scales & parts
  heroScrollTimeline.fromTo(
    ".revealer-content",
    { opacity: 0, scale: 0.9, y: 30 },
    { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" },
    0.25,
  );
  heroScrollTimeline.to(
    ".revealer-content",
    { opacity: 0, scale: 1.1, duration: 0.15, ease: "power1.in" },
    0.42,
  );

  // Cascading hero images: scale in from 0 to full screen one by one in the stack
  const cascadeStart = 0.44;
  const cascadeStagger = 0.08;
  const cascadeDuration = 0.2;
  heroImages.forEach((heroImage, index) => {
    heroScrollTimeline.to(
      heroImage,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        scale: 1,
        duration: cascadeDuration,
      },
      cascadeStart + index * cascadeStagger,
    );
  });

  // Outro text scales from 0 to 1 (takes 100% of the screen)
  const outroEnterStart = cascadeStart + heroImages.length * cascadeStagger + 0.04; // 0.72
  const outroScaleDuration = 0.22;
  const outroSplitStart = outroEnterStart + outroScaleDuration + 0.06; // 1.00

  heroScrollTimeline.to(
    ".hero-outro-content",
    { scale: 1, duration: outroScaleDuration, ease: "power2.out" },
    outroEnterStart,
  );

  // Once outro reaches 100% full screen, hide previous hero background images so hero-img-3.jpg is not pinned behind
  heroScrollTimeline.set(
    [heroBackground, heroImagesWrapper, heroRevealer],
    { autoAlpha: 0 },
    outroSplitStart,
  );

  // ONLY when it's taking 100% of the screen, split it symmetrically in opposite directions
  // Left half opens from center (50%) back to left (0%), right half opens from center (50%) to right (100%)
  heroScrollTimeline.to(
    ".hero-outro-left",
    {
      clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      duration: 0.28,
      ease: "power2.inOut",
    },
    outroSplitStart,
  );
  heroScrollTimeline.to(
    ".hero-outro-right",
    {
      clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      duration: 0.28,
      ease: "power2.inOut",
    },
    outroSplitStart,
  );

  // When split occurs: reveal light bg track instantly behind the opening outro doors (no fading)
  if (heroScrollTextTrack && heroScrollTextContent) {
    heroScrollTimeline.set(
      heroScrollTextTrack,
      { opacity: 1 },
      outroSplitStart,
    );

    // Continuous scroll: text moves up from bottom (yPercent: 100).
    // Exactly at the timeline end, the text top is at the top of the screen (top: 0),
    // precisely as the hero section unpins and the gallery-showcase arrives aligned at the bottom (bottom: 0).
    heroScrollTimeline.fromTo(
      heroScrollTextContent,
      { yPercent: 110, opacity: 1 },
      {
        yPercent: -50,
        duration: 0.45,
        ease: "none",
      },
      outroSplitStart + 0.04,
    );
  }

  // =========================================================================
  // SCENE 2: PINNED SHOWCASE GALLERY CASCADE & HORIZONTAL EXPEDITION
  // =========================================================================
  const gallerySection = document.querySelector(".gallery-showcase");
  const galleryCardsWrap = document.querySelector(".gallery-cards");
  const galleryCards = gsap.utils.toArray(".gallery-card");
  const progressBar = document.querySelector(".gallery-progress .progress-bar");
  const galleryHeading = document.querySelector(".gallery-heading");

  // Initial card clip-path and subtle tilt
  gsap.set(galleryCards, {
    clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
    y: 60,
    scale: 0.92,
  });

  // Calculate horizontal travel distance
  const getScrollAmount = () => {
    const cardsWidth = galleryCardsWrap.scrollWidth;
    const windowWidth = window.innerWidth;
    return -(cardsWidth - windowWidth + windowWidth * 0.1);
  };

  const galleryTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: gallerySection,
      start: "top top",
      end: "+=450%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // 2a. Heading entrance: already visible, subtle elegant lift
  galleryTimeline.fromTo(
    galleryHeading,
    { y: 30, opacity: 0.7 },
    {
      y: 0,
      opacity: 1,
      duration: 0.15,
      ease: "power2.out",
    },
    0,
  );

  // 2b. Cascade cards unfolding upward into view
  galleryTimeline.to(
    galleryCards,
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      y: 0,
      scale: 1,
      duration: 0.35,
      stagger: 0.05,
      ease: "power3.out",
    },
    0.1,
  );

  // 2c. Horizontal glide of gallery cards across the viewport
  galleryTimeline.to(
    galleryCardsWrap,
    {
      x: () => getScrollAmount(),
      duration: 0.7,
      ease: "none",
    },
    0.3,
  );

  // 2d. Synchronize horizontal progress bar
  galleryTimeline.to(
    progressBar,
    {
      width: "100%",
      duration: 0.7,
      ease: "none",
    },
    0.3,
  );

  // 2e. Subtle individual parallax on image cards during glide
  galleryCards.forEach((card, i) => {
    const cardImg = card.querySelector("img");
    galleryTimeline.to(
      cardImg,
      {
        xPercent: i % 2 === 0 ? 12 : -12,
        duration: 0.7,
        ease: "none",
      },
      0.3,
    );
  });

  // =========================================================================
  // SCENE 3: KINETIC EDITORIAL ABOUT SECTION REVEALS
  // =========================================================================
  const aboutSection = document.querySelector(".about");
  const aboutHeadline = document.querySelector(".about-headline h3");
  const aboutDetails = document.querySelectorAll(".about-details p");
  const statItems = document.querySelectorAll(".stat-item");
  const aboutTop = document.querySelector(".about-top");

  // ScrollTrigger timeline for About section
  const aboutTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: "top 75%",
      end: "bottom bottom",
      scrub: 1,
    },
  });

  aboutTimeline.from(
    aboutTop,
    {
      opacity: 0,
      y: 20,
      duration: 0.2,
    },
    0,
  );

  aboutTimeline.from(
    aboutHeadline,
    {
      opacity: 0,
      y: 70,
      duration: 0.4,
      ease: "power2.out",
    },
    0.1,
  );

  aboutTimeline.from(
    aboutDetails,
    {
      opacity: 0,
      y: 40,
      stagger: 0.1,
      duration: 0.35,
      ease: "power2.out",
    },
    0.25,
  );

  aboutTimeline.from(
    statItems,
    {
      opacity: 0,
      y: 35,
      scale: 0.95,
      stagger: 0.08,
      duration: 0.35,
      ease: "back.out(1.4)",
    },
    0.4,
  );

  // =========================================================================
  // SCENE 4: PINNED 3D OVERLAPPING STACK CARDS
  // =========================================================================
  const stackSection = document.querySelector(".stack-section");
  const stackCards = gsap.utils.toArray(".stack-card");
  const stackTitleItems = gsap.utils.toArray(".stack-title-item");
  const activeIndexEl = document.querySelector(".stack-counter .active-index");

  // Initial states: card 1 starts in view, cards 2-4 start below
  stackCards.forEach((card, idx) => {
    if (idx > 0) {
      gsap.set(card, { yPercent: 120, scale: 0.95, filter: "brightness(0.8)" });
    } else {
      gsap.set(card, { yPercent: 0, scale: 1, filter: "brightness(1)" });
    }
  });

  const stackTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: stackSection,
      start: "top top",
      end: "+=400%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Switch titles and counter based on progress
        const step = Math.min(3, Math.floor(self.progress * 4));
        activeIndexEl.textContent = `0${step + 1}`;
        stackTitleItems.forEach((title, i) => {
          if (i === step) {
            title.classList.add("active");
          } else {
            title.classList.remove("active");
          }
        });
      },
    },
  });

  // Animate cards stacking one over another
  // Card 2 slides up, Card 1 scales down and dims
  stackTimeline.to(
    stackCards[0],
    { scale: 0.92, filter: "brightness(0.65)", duration: 0.8, ease: "power2.out" },
    0.2,
  );
  stackTimeline.to(
    stackCards[1],
    { yPercent: 0, scale: 1, filter: "brightness(1)", duration: 1, ease: "power2.out" },
    0.2,
  );

  // Card 3 slides up, Cards 1 & 2 step back
  stackTimeline.to(
    stackCards[0],
    { scale: 0.86, filter: "brightness(0.4)", duration: 0.8, ease: "power2.out" },
    1.2,
  );
  stackTimeline.to(
    stackCards[1],
    { scale: 0.93, filter: "brightness(0.65)", duration: 0.8, ease: "power2.out" },
    1.2,
  );
  stackTimeline.to(
    stackCards[2],
    { yPercent: 0, scale: 1, filter: "brightness(1)", duration: 1, ease: "power2.out" },
    1.2,
  );

  // Card 4 slides up, Cards 1, 2, 3 step back
  stackTimeline.to(
    stackCards[1],
    { scale: 0.87, filter: "brightness(0.4)", duration: 0.8, ease: "power2.out" },
    2.2,
  );
  stackTimeline.to(
    stackCards[2],
    { scale: 0.94, filter: "brightness(0.65)", duration: 0.8, ease: "power2.out" },
    2.2,
  );
  stackTimeline.to(
    stackCards[3],
    { yPercent: 0, scale: 1, filter: "brightness(1)", duration: 1, ease: "power2.out" },
    2.2,
  );

  // =========================================================================
  // SCENE 5: PINNED 3-COLUMN COUNTER-SCROLLING RUNWAY
  // =========================================================================
  const runwaySection = document.querySelector(".runway-section");
  const col1 = document.querySelector(".runway-col.col-1");
  const col2 = document.querySelector(".runway-col.col-2");
  const col3 = document.querySelector(".runway-col.col-3");
  const runwayBadge = document.querySelector(".runway-badge");

  // Initial column positions: col 1 & 3 start at y: 0, col 2 starts pulled up
  gsap.set(col1, { yPercent: 15 });
  gsap.set(col2, { yPercent: -45 });
  gsap.set(col3, { yPercent: 20 });

  const runwayTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: runwaySection,
      start: "top top",
      end: "+=400%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // Center badge scale entrance & gentle pulse
  runwayTimeline.from(
    runwayBadge,
    {
      scale: 0.85,
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    },
    0,
  );

  // Counter directions: col1 moves UP, col2 moves DOWN, col3 moves UP
  runwayTimeline.to(
    col1,
    {
      yPercent: -45,
      duration: 1,
      ease: "none",
    },
    0,
  );

  runwayTimeline.to(
    col2,
    {
      yPercent: 15,
      duration: 1,
      ease: "none",
    },
    0,
  );

  runwayTimeline.to(
    col3,
    {
      yPercent: -40,
      duration: 1,
      ease: "none",
    },
    0,
  );

  // =========================================================================
  // SCENE 6: FULL-SCREEN CURTAIN WIPE / DAY-TO-NIGHT REVEAL
  // =========================================================================
  const curtainSection = document.querySelector(".curtain-section");
  const layerTop = document.querySelector(".layer-top");
  const curtainLine = document.querySelector(".curtain-line");
  const headlineNight = document.querySelector(".headline-night");
  const headlineWords = document.querySelectorAll(".headline-layer .word");
  const infoLeft = document.querySelector(".info-left");
  const infoRight = document.querySelector(".info-right");
  const imgDay = document.querySelector(".img-day");
  const imgNight = document.querySelector(".img-night");
  const timeVal = document.querySelector(".curtain-hud .time-val");
  const timePeriod = document.querySelector(".curtain-hud .time-period");
  const luxVal = document.querySelector(".curtain-hud .lux-val");

  // Initial state setup for cards and layers
  gsap.set(infoLeft, { opacity: 1, x: 0, y: 0, filter: "blur(0px)" });
  gsap.set(infoRight, { opacity: 0, x: 60, y: 0, filter: "blur(10px)" });
  gsap.set(imgDay, { scale: 1 });
  gsap.set(imgNight, { scale: 1.1 });

  // Telemetry time interpolation object
  const timeTelemetry = { minutes: 7 * 60 + 45, lux: 94200 }; // 07:45 AM (465 mins) to 09:30 PM (1290 mins)

  const curtainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: curtainSection,
      start: "top top",
      end: "+=380%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Dynamic time readout synchronized to scroll progress
        const currentMins = Math.round(465 + self.progress * (1290 - 465));
        const hours24 = Math.floor(currentMins / 60);
        const mins = currentMins % 60;
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        const timeStr = `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
        if (timeVal) timeVal.textContent = timeStr;
        if (timePeriod) timePeriod.textContent = period;

        // Dynamic lux calculation
        const currentLux = Math.round(94200 * Math.pow(1 - self.progress, 2.5) + 40);
        if (luxVal) luxVal.textContent = `${currentLux.toLocaleString()} lx`;
      },
    },
  });

  // 1. Wipe top night layer across screen from right to left (100% -> 0%)
  curtainTimeline.fromTo(
    layerTop,
    { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" },
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "none",
    },
    0,
  );

  // 2. Synchronized clipping for the top Night kinetic headline
  if (headlineNight) {
    curtainTimeline.fromTo(
      headlineNight,
      { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" },
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1,
        ease: "none",
      },
      0,
    );
  }

  // 3. Move divider line with handle in precision lockstep
  curtainTimeline.fromTo(
    curtainLine,
    { left: "100%" },
    {
      left: "0%",
      duration: 1,
      ease: "none",
    },
    0,
  );

  // 4. Subtle background zoom / parallax for cinematic depth
  if (imgDay) {
    curtainTimeline.to(
      imgDay,
      {
        scale: 1.08,
        filter: "brightness(0.7) contrast(1.1)",
        duration: 1,
        ease: "none",
      },
      0,
    );
  }
  if (imgNight) {
    curtainTimeline.to(
      imgNight,
      {
        scale: 1,
        duration: 1,
        ease: "none",
      },
      0,
    );
  }

  // 5. Kinetic tracking on the headline text across scroll
  curtainTimeline.to(
    ".headline-layer",
    {
      letterSpacing: "0.08em",
      scale: 1.05,
      duration: 1,
      ease: "power1.inOut",
    },
    0,
  );

  // 6. Day Info Card exits with smooth slide, blur and fade
  if (infoLeft) {
    curtainTimeline.to(
      infoLeft,
      {
        opacity: 0,
        x: -80,
        y: -20,
        filter: "blur(12px)",
        duration: 0.35,
        ease: "power2.in",
      },
      0.15,
    );
  }

  // 7. Night Info Card enters with crisp unblur, title stagger, and metrics pop
  if (infoRight) {
    curtainTimeline.to(
      infoRight,
      {
        opacity: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
        duration: 0.45,
        ease: "power3.out",
      },
      0.55,
    );

    curtainTimeline.fromTo(
      ".info-right .metric-pill",
      {
        opacity: 0,
        y: 20,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.08,
        duration: 0.3,
        ease: "back.out(1.7)",
      },
      0.72,
    );
  }

  // =========================================================================
  // SCENE 7: MONUMENTAL PORTAL ZOOM & KINETIC FOOTER
  // =========================================================================
  const portalSection = document.querySelector(".portal-section");
  const portalIris = document.querySelector(".portal-iris");
  const portalBg = document.querySelector(".portal-bg");
  const lineLeft = document.querySelector(".line-left");
  const lineRight = document.querySelector(".line-right");
  const portalSubtitle = document.querySelector(".portal-subtitle");

  const portalTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: portalSection,
      start: "top top",
      end: "+=350%",
      pin: ".portal-wrap",
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // Portal iris expands from 12% aperture to 150% engulfing the entire viewport
  portalTimeline.to(
    portalIris,
    {
      clipPath: "circle(150% at 50% 50%)",
      duration: 1,
      ease: "power2.inOut",
    },
    0,
  );

  // Architectural background zooms in slowly
  portalTimeline.to(
    portalBg,
    {
      scale: 1,
      duration: 1,
      ease: "power1.out",
    },
    0,
  );

  // Kinetic typography slides into focus from opposing directions
  portalTimeline.from(
    portalSubtitle,
    {
      opacity: 0,
      y: 30,
      duration: 0.3,
    },
    0.2,
  );

  portalTimeline.fromTo(
    lineLeft,
    { xPercent: -50, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
    0.2,
  );

  portalTimeline.fromTo(
    lineRight,
    { xPercent: 50, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
    0.2,
  );

  // Smooth back-to-top handler via Lenis
  const backToTopBtn = document.getElementById("backToTop");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      lenis.scrollTo(0, { duration: 2 });
    });
  }

  // Recalculate ScrollTrigger on dynamic resize
  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });
});

 