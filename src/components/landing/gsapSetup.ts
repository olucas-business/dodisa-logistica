import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// gsap.registerPlugin is idempotent — safe to call on every import.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
