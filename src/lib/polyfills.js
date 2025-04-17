/**
 * Modern CSS Feature Detection and Polyfills
 * Provides fallbacks for browsers that don't support modern CSS features
 */

// Feature detection utilities
const supportsCSS = (property) => {
  return CSS.supports && CSS.supports(property, 'initial');
};

const supportsColorFunction = () => {
  return supportsCSS('color', 'color-mix(in srgb, #f00, #00f)');
};

const supportsContainerQueries = () => {
  return supportsCSS('@container', 'initial');
};

const supportsScrollTimeline = () => {
  return supportsCSS('animation-timeline', 'scroll()');
};

const supportsCSSNesting = () => {
  try {
    return supportsCSS('selector(&)', '&');
  } catch (_) {
    return false;
  }
};

const supportsViewTransitions = () => {
  return document.startViewTransition !== undefined;
};

const supportsBackdropFilter = () => {
  return supportsCSS('backdrop-filter', 'blur(10px)');
};

// Polyfill for scroll-driven animations
const polyfillScrollAnimations = () => {
  if (!supportsScrollTimeline()) {
    console.info('Polyfilling scroll-driven animations with IntersectionObserver');
    
    // Select all elements with reveal classes
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-right');
    
    // Create an observer
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add class to trigger animation
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Observe each element
    revealElements.forEach((el) => {
      observer.observe(el);
    });
    
    // Handle staggered reveals
    const staggerContainers = document.querySelectorAll('.reveal-stagger');
    const staggerObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Get all children
            const children = Array.from(entry.target.children);
            children.forEach((child, i) => {
              // Add animation with delay based on index
              setTimeout(() => {
                child.classList.add('animate-fade-in');
              }, i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    staggerContainers.forEach((container) => {
      staggerObserver.observe(container);
    });
  }
};

// Polyfill for glass morphism effects
const polyfillGlassMorphism = () => {
  if (!supportsBackdropFilter()) {
    console.info('Adding alternative styles for glass morphism effects');
    
    // Add alternative class to all glass elements
    const glassElements = document.querySelectorAll('.glass');
    glassElements.forEach((el) => {
      el.classList.add('no-backdrop-filter');
    });
    
    // Inject CSS fallback
    const style = document.createElement('style');
    style.textContent = `
      .no-backdrop-filter {
        background-color: rgba(30, 41, 59, 0.9) !important; /* Fallback background */
      }
    `;
    document.head.appendChild(style);
  }
};

// Handle reduced motion preference
const setupReducedMotion = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const updateReducedMotion = (reduced) => {
    if (reduced) {
      document.documentElement.classList.add('reduce-motion');
      
      // Inject CSS to override animations
      if (!document.getElementById('reduced-motion-style')) {
        const style = document.createElement('style');
        style.id = 'reduced-motion-style';
        style.textContent = `
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.classList.remove('reduce-motion');
      const style = document.getElementById('reduced-motion-style');
      if (style) {
        style.remove();
      }
    }
  };
  
  // Initial setup
  updateReducedMotion(mediaQuery.matches);
  
  // Listen for changes
  mediaQuery.addEventListener('change', () => {
    updateReducedMotion(mediaQuery.matches);
  });
};

// Initialize polyfills and feature detection
const initPolyfills = () => {
  // Run polyfills after DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPolyfills);
  } else {
    setupPolyfills();
  }
};

const setupPolyfills = () => {
  // Log feature support
  console.info('CSS Feature Support:', {
    colorFunctions: supportsColorFunction(),
    containerQueries: supportsContainerQueries(),
    scrollTimelines: supportsScrollTimeline(),
    cssNesting: supportsCSSNesting(),
    viewTransitions: supportsViewTransitions(),
    backdropFilter: supportsBackdropFilter()
  });
  
  // Apply polyfills
  polyfillScrollAnimations();
  polyfillGlassMorphism();
  setupReducedMotion();
  
  // Add a class to body to indicate polyfilled features
  document.body.classList.add('polyfills-applied');
};

// Run initialization
initPolyfills();