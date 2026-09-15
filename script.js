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
  // =========================================================================
  // =========================================================================
  // SCENE 6: DUAL-COLUMN ARCHITECTURAL MORPH (sw.md Pure Slide Experience)
  // =========================================================================
  const scene6Section = document.querySelector(".scene6-section");
  const slideNight = document.querySelector(".slide-night");
  const dayTitleLines = document.querySelectorAll(".slide-day .line__inner");
  const dayTxt = document.querySelector(".slide-day .scene6-txt");
  const dayLink = document.querySelector(".slide-day .scene6-link");
  const dayImgWrap = document.querySelector(".slide-day .scene6-image-wrap");

  const nightTitleLines = document.querySelectorAll(".slide-night .line__inner");
  const nightTxt = document.querySelector(".slide-night .scene6-txt");
  const nightLink = document.querySelector(".slide-night .scene6-link");
  const nightImgWrap = document.querySelector(".slide-night .scene6-image-wrap");

  const timeVal = document.querySelector(".scene6-hud .time-val");
  const timePeriod = document.querySelector(".scene6-hud .time-period");
  const luxVal = document.querySelector(".scene6-hud .lux-val");

  // Initial states
  gsap.set(dayTitleLines, { y: 0, opacity: 1 });
  if (dayTxt) gsap.set(dayTxt, { x: 0, opacity: 1 });
  if (dayLink) gsap.set(dayLink, { x: 0, opacity: 1 });
  if (dayImgWrap) gsap.set(dayImgWrap, { y: "-10vh" });

  gsap.set(slideNight, {
    clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
  });
  gsap.set(nightTitleLines, { y: 160, opacity: 0 });
  if (nightTxt) gsap.set(nightTxt, { x: 80, opacity: 0 });
  if (nightLink) gsap.set(nightLink, { x: -60, opacity: 0 });
  if (nightImgWrap) gsap.set(nightImgWrap, { y: "-35vh" });

  // Interactive slide link effects from sw.md
  [dayLink, nightLink].forEach((link) => {
    if (!link) return;
    const circ = link.querySelector(".slide-link__circ");
    const line = link.querySelector(".slide-link__line");

    link.addEventListener("mouseenter", () => {
      gsap.to(circ, { scale: 1.15, duration: 0.4, ease: "power3.out" });
      gsap.to(line, { x: 10, scaleX: 1.15, transformOrigin: "left center", duration: 0.4, ease: "power3.out" });
    });
    link.addEventListener("mouseleave", () => {
      gsap.to(circ, { scale: 1, duration: 0.4, ease: "power3.out" });
      gsap.to(line, { x: 0, scaleX: 1, transformOrigin: "left center", duration: 0.4, ease: "power3.out" });
    });
  });

  const scene6Timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene6Section,
      start: "top top",
      end: "+=380%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Dynamic chrono telemetry readout: 07:45 AM (465m) to 09:30 PM (1290m)
        const currentMins = Math.round(465 + self.progress * (1290 - 465));
        const hours24 = Math.floor(currentMins / 60);
        const mins = currentMins % 60;
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        const timeStr = `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
        if (timeVal) timeVal.textContent = timeStr;
        if (timePeriod) timePeriod.textContent = period;

        // Dynamic light lux
        const currentLux = Math.round(94200 * Math.pow(1 - self.progress, 2.5) + 20);
        if (luxVal) luxVal.textContent = `${currentLux.toLocaleString()} lx`;
      },
    },
  });

  // 1. Parallax drift on Day image wrapper (sw.md style: 160vh image gliding through window)
  if (dayImgWrap) {
    scene6Timeline.to(
      dayImgWrap,
      {
        y: "25vh",
        duration: 0.6,
        ease: "none",
      },
      0,
    );
  }

  // 2. Day typography & link transition out (y translation + masked overflow stagger)
  if (dayTitleLines.length) {
    scene6Timeline.to(
      dayTitleLines,
      {
        y: -140,
        opacity: 0,
        stagger: 0.06,
        duration: 0.35,
        ease: "power3.in",
      },
      0.12,
    );
  }
  if (dayTxt) {
    scene6Timeline.to(
      dayTxt,
      {
        x: -50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      },
      0.12,
    );
  }
  if (dayLink) {
    scene6Timeline.to(
      dayLink,
      {
        x: -40,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      },
      0.14,
    );
  }

  // 3. Slide Night unveils vertically over Slide Day (sw.md slide unmasking)
  scene6Timeline.to(
    slideNight,
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 0.7,
      ease: "power2.inOut",
    },
    0.3,
  );

  // 4. Parallax drift on Night image wrapper (-35vh -> 15vh)
  if (nightImgWrap) {
    scene6Timeline.to(
      nightImgWrap,
      {
        y: "15vh",
        duration: 0.7,
        ease: "none",
      },
      0.3,
    );
  }

  // 5. Night typography & link entrance (sw.md: rising from overflow mask with power4 ease)
  if (nightTitleLines.length) {
    scene6Timeline.to(
      nightTitleLines,
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.5,
        ease: "power4.out",
      },
      0.5,
    );
  }
  if (nightTxt) {
    scene6Timeline.to(
      nightTxt,
      {
        x: 0,
        opacity: 1,
        duration: 0.45,
        ease: "power3.out",
      },
      0.58,
    );
  }
  if (nightLink) {
    scene6Timeline.to(
      nightLink,
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
      },
      0.64,
    );
  }



  // =========================================================================
  // SCENE 3.5: 3D FOLDED MARQUEE ACCORDION (exact tt.md logic & ranges)
  // =========================================================================
  const foldSection = document.querySelector(".fold-section");
  if (foldSection) {
    const centerFold = document.getElementById("center-fold");
    const centerContent = document.getElementById("center-content");
    const foldsContent = Array.from(foldSection.querySelectorAll(".fold-content"));

    // Pinned wrapper timeline for the fold effect
    const foldTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: foldSection,
        start: "top top",
        end: "+=320%",
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Marquee horizontal animation scrub: exactly [-500, -1500] and [-500, 0]
    // Animate across all folds simultaneously
    [0, 1, 2, 3].forEach((index) => {
      const [xStart, xEnd] =
        index % 2 === 0 ? [-500, -1500] : [-500, 0];
      const tracks = foldSection.querySelectorAll(
        `.fold-content .marquee:nth-child(${index + 1}) .track`,
      );

      foldTimeline.fromTo(
        tracks,
        { x: xStart },
        {
          x: xEnd,
          ease: "none",
          duration: 1,
        },
        0,
      );
    });

    // Vertical fold content travel calculation from tt.md:
    // overflowHeight = centerContent.clientHeight - centerFold.clientHeight
    const getOverflow = () => {
      if (!centerContent || !centerFold) return 600;
      return Math.max(0, centerContent.scrollHeight - centerFold.clientHeight);
    };

    foldTimeline.fromTo(
      foldsContent,
      { y: 0 },
      {
        y: () => -getOverflow(),
        ease: "none",
        duration: 1,
      },
      0,
    );
  }

  // =========================================================================
  // SCENE 4: PINNED 3D OVERLAPPING STACK CARDS (sw.md Skiper17 Animation + Scene 6 Text)
  // =========================================================================
  const stackSection = document.querySelector(".stack-section");
  const stackCards = gsap.utils.toArray(".stack-card");
  const stackTitleItems = gsap.utils.toArray(".stack-title-item");
  const activeIndexEl = document.querySelector(".stack-counter .active-index");
  const totalCards = stackCards.length; // 4 cards

  // Initialize card positions & rotations strictly following sw.md Skiper 17:
  // Card 0 at y: "0%", scale: 1, rotation: 0
  // Cards 1..N at y: "100%", scale: 1, rotation: 0
  if (stackCards[0]) {
    gsap.set(stackCards[0], { y: "0%", scale: 1, rotation: 0, transformOrigin: "center center" });
  }
  for (let i = 1; i < totalCards; i++) {
    if (stackCards[i]) {
      gsap.set(stackCards[i], { y: "100%", scale: 1, rotation: 0, transformOrigin: "center center" });
    }
  }

  // Initialize Scene 6 style text animations:
  // Active item lines at y: 0, opacity: 1, txt at x: 0, opacity: 1
  // Inactive item lines at y: 140, opacity: 0, txt at x: 60, opacity: 0
  stackTitleItems.forEach((item, idx) => {
    const lines = item.querySelectorAll(".line__inner");
    const txt = item.querySelector(".stack-txt");
    if (idx === 0) {
      item.classList.add("active");
      gsap.set(lines, { y: 0, opacity: 1 });
      if (txt) gsap.set(txt, { x: 0, opacity: 1 });
    } else {
      item.classList.remove("active");
      gsap.set(lines, { y: 140, opacity: 0 });
      if (txt) gsap.set(txt, { x: 60, opacity: 0 });
    }
  });

  // Timeline matching sw.md pin & scrub: 0.5 with totalCards - 1 steps
  const stackTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: stackSection,
      start: "top top",
      end: `+=${window.innerHeight * (totalCards - 1)}`,
      pin: true,
      scrub: 0.5,
      pinSpacing: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Counter readout
        const step = Math.min(totalCards - 1, Math.floor(self.progress * totalCards));
        if (activeIndexEl) {
          activeIndexEl.textContent = `0${step + 1}`;
        }
      },
    },
  });

  // Animate transitions between steps (i -> i + 1)
  for (let i = 0; i < totalCards - 1; i++) {
    const currentCard = stackCards[i];
    const nextCard = stackCards[i + 1];
    const currentTitleItem = stackTitleItems[i];
    const nextTitleItem = stackTitleItems[i + 1];
    const position = i;

    // --- SW.MD CARD ANIMATION ---
    // currentCard scales to 0.7 and rotates 5deg
    // nextCard translates from y: 100% to y: 0%
    if (currentCard && nextCard) {
      stackTimeline.to(
        currentCard,
        {
          scale: 0.7,
          rotation: 5,
          duration: 1,
          ease: "none",
        },
        position,
      );

      stackTimeline.to(
        nextCard,
        {
          y: "0%",
          duration: 1,
          ease: "none",
        },
        position,
      );
    }

    // --- SCENE 6 TEXT ANIMATION ---
    // Exit current title item: lines translate y: -120 and fade, txt moves x: -40 and fades (Scene 6 style)
    if (currentTitleItem) {
      const curLines = currentTitleItem.querySelectorAll(".line__inner");
      const curTxt = currentTitleItem.querySelector(".stack-txt");

      stackTimeline.to(
        curLines,
        {
          y: -120,
          opacity: 0,
          stagger: 0.05,
          duration: 0.38,
          ease: "power3.in",
          onComplete: () => {
            currentTitleItem.classList.remove("active");
          },
          onReverseComplete: () => {
            currentTitleItem.classList.add("active");
          },
        },
        position + 0.08,
      );

      if (curTxt) {
        stackTimeline.to(
          curTxt,
          {
            x: -40,
            opacity: 0,
            duration: 0.32,
            ease: "power2.in",
          },
          position + 0.08,
        );
      }
    }

    // Enter next title item: lines rise from y: 140 -> 0 with stagger & power4.out, txt slides in x: 60 -> 0 (Scene 6 style)
    if (nextTitleItem) {
      const nextLines = nextTitleItem.querySelectorAll(".line__inner");
      const nextTxt = nextTitleItem.querySelector(".stack-txt");

      stackTimeline.to(
        nextTitleItem,
        {
          opacity: 1,
          duration: 0.01,
          onStart: () => {
            nextTitleItem.classList.add("active");
          },
          onReverseComplete: () => {
            nextTitleItem.classList.remove("active");
          },
        },
        position + 0.46,
      );

      stackTimeline.fromTo(
        nextLines,
        { y: 140, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.52,
          ease: "power4.out",
        },
        position + 0.48,
      );

      if (nextTxt) {
        stackTimeline.fromTo(
          nextTxt,
          { x: 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.48,
            ease: "power3.out",
          },
          position + 0.52,
        );
      }
    }
  }

  // =========================================================================
  // SCENE 5: SCROLL-DRIVEN ARCHITECTURAL CROSSFADES (from tt.md)
  // =========================================================================
  const scene5Swappers = document.querySelectorAll(".scene5-crossfades .swapper");

  scene5Swappers.forEach((swapper) => {
    const parentBox = swapper.closest(".image-box");
    const controller = parentBox ? parentBox.querySelector(".controller") : null;
    const images = swapper.querySelectorAll("img");
    const progressDiv = swapper.querySelector(".progress");
    const progressMarkers = swapper.querySelectorAll(".progress > div div");

    // Responsive setup: desktop vs mobile
    ScrollTrigger.matchMedia({
      // Desktop: Smooth translation down the tall controller column + crisp crossfade + dual progress
      "(min-width: 901px)": function () {
        if (controller) {
          const moveDist = () => controller.offsetHeight - swapper.offsetHeight;
          gsap.to(swapper, {
            y: () => moveDist(),
            ease: "none",
            scrollTrigger: {
              trigger: parentBox,
              start: "top center",
              end: "bottom center",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        // Fast & crisp image crossfade centered around midpoint, completing fully (opacity: 1)
        if (images.length > 1) {
          gsap.fromTo(
            images[1],
            { opacity: 0 },
            {
              opacity: 1,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: parentBox,
                start: "center 68%",
                end: "center 36%",
                scrub: true,
              },
            },
          );
        }

        // Progress bar markers completing in sequence
        if (progressMarkers.length >= 2) {
          gsap.fromTo(
            progressMarkers[0],
            { height: "0%" },
            {
              height: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: parentBox,
                start: "top 60%",
                end: "center 55%",
                scrub: true,
              },
            },
          );
          gsap.fromTo(
            progressMarkers[1],
            { height: "0%" },
            {
              height: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: parentBox,
                start: "center 55%",
                end: "bottom 55%",
                scrub: true,
              },
            },
          );
        }
      },

      // Mobile: In-place fast crossfade & progress driven by swapper trigger
      "(max-width: 900px)": function () {
        if (images.length > 1) {
          gsap.fromTo(
            images[1],
            { opacity: 0 },
            {
              opacity: 1,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: swapper,
                start: "top 65%",
                end: "bottom 45%",
                scrub: true,
              },
            },
          );
        }

        if (progressMarkers.length >= 2) {
          gsap.fromTo(
            progressMarkers[0],
            { height: "0%" },
            {
              height: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: swapper,
                start: "top 75%",
                end: "center center",
                scrub: true,
              },
            },
          );
          gsap.fromTo(
            progressMarkers[1],
            { height: "0%" },
            {
              height: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: swapper,
                start: "center center",
                end: "bottom 35%",
                scrub: true,
              },
            },
          );
        }
      },
    });
  });


  // =========================================================================
  // SCENE 7: MONUMENTAL ARCHITECTURAL LENS UNFOLD & KINETIC FOOTER (Option 2)
  // =========================================================================
  const portalSection = document.querySelector(".portal-section");
  const portalIris = document.querySelector(".portal-iris");
  const portalBg = document.querySelector(".portal-bg");
  const portalOverlay = document.querySelector(".portal-overlay");
  const lineLeft = document.querySelector(".line-left");
  const lineRight = document.querySelector(".line-right");
  const portalSubtitle = document.querySelector(".portal-subtitle");

  // Initial states for cinematic lens reveal
  gsap.set(portalIris, {
    clipPath: "inset(12% 8% round 24px)",
    scale: 0.96,
  });
  gsap.set(portalBg, {
    scale: 1.28,
  });

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

  // 1. Unfold from elegant architectural rounded window to full-bleed fullscreen immersion
  portalTimeline.to(
    portalIris,
    {
      clipPath: "inset(0% 0% round 0px)",
      scale: 1,
      duration: 1,
      ease: "power2.inOut",
    },
    0,
  );

  // 2. Cinematic slow zoom & parallax glide on the horizon image
  portalTimeline.to(
    portalBg,
    {
      scale: 1,
      duration: 1.2,
      ease: "power1.out",
    },
    0,
  );

  // 3. Ambient lighting adjustment
  if (portalOverlay) {
    portalTimeline.to(
      portalOverlay,
      {
        backgroundColor: "rgba(5, 7, 10, 0.45)",
        duration: 1,
      },
      0,
    );
  }

  // 4. Subtitle rises smoothly with subtle letter tracking
  portalTimeline.fromTo(
    portalSubtitle,
    { opacity: 0, y: 35, letterSpacing: "0.15em" },
    {
      opacity: 1,
      y: 0,
      letterSpacing: "0.3em",
      duration: 0.5,
      ease: "power2.out",
    },
    0.25,
  );

  // 5. Opposing kinetic typography glides gracefully into center alignment
  portalTimeline.fromTo(
    lineLeft,
    { xPercent: -45, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
    0.25,
  );

  portalTimeline.fromTo(
    lineRight,
    { xPercent: 45, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
    0.25,
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

