import React, { useRef, useEffect } from "react";

const VantaGlobeBG = ({ darkMode, children }) => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    let mounted = true;
    let vantaCleanup = null;
    let threeScript, vantaScript;

    const loadScripts = async () => {
      if (window.THREE && window.VANTA && window.VANTA.GLOBE) return true;

      if (!window.THREE) {
        threeScript = document.createElement("script");
        threeScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js";
        threeScript.async = true;
        document.body.appendChild(threeScript);
        await new Promise((res) => {
          threeScript.onload = res;
        });
      }

      if (!window.VANTA || !window.VANTA.GLOBE) {
        vantaScript = document.createElement("script");
        vantaScript.src =
          "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js";
        vantaScript.async = true;
        document.body.appendChild(vantaScript);
        await new Promise((res) => {
          vantaScript.onload = res;
        });
      }
      return true;
    };

    loadScripts().then(() => {
      if (!mounted || !window.VANTA || !window.VANTA.GLOBE) return;
      if (vantaEffect.current) vantaEffect.current.destroy();

      // Heart-themed Vanta Globe configuration
      vantaEffect.current = window.VANTA.GLOBE({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        size: 1.2,

        // OpenHeart Chain Red/Pink Theme
        color: darkMode ? 0xdc2626 : 0xef4444, // Red-600 to Red-500
        color2: darkMode ? 0xdb2777 : 0xf472b6, // Pink-600 to Pink-400
        backgroundColor: darkMode ? 0x0f172a : 0xfef2f2, // Gray-900 to Red-50

        // Globe configuration
        points: 16.0, // More points for fuller globe
        maxDistance: 30.0, // Spread connections further
        spacing: 18.0, // Slightly closer points
        showLines: true,
        lineColor: darkMode ? 0xf87171 : 0xfca5a5, // Red-400 to Red-300
        lineAlpha: darkMode ? 0.4 : 0.3, // More subtle lines

        // Animation settings
        amplitudeFactor: 2.0, // More movement
        amplitudeSpeed: 0.5, // Slower, smoother animation
        rotationSpeed: 0.3, // Gentle rotation

        // Visual effects
        showDots: true,
        dotColor: darkMode ? 0xfca5a5 : 0xfecaca, // Red-300 to Red-200
        dotSize: 1.5, // Slightly larger dots
        dotAlpha: 0.7, // Visible but not overwhelming

        // Performance
        cameraDistance: 400.0, // Good zoom level
        maxParticles: 8000, // More particles for richness
      });

      vantaCleanup = () => {
        if (vantaEffect.current) vantaEffect.current.destroy();
        vantaEffect.current = null;
      };
    });

    return () => {
      mounted = false;
      if (vantaCleanup) vantaCleanup();
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, [darkMode]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Vanta Background with gradient overlay */}
      <div
        ref={vantaRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Gradient overlay to enhance theme */}
      <div
        className={`fixed inset-0 z-1 pointer-events-none transition-opacity duration-500 ${
          darkMode ? "opacity-20" : "opacity-10"
        }`}
        style={{
          background: darkMode
            ? "radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.3) 0%, rgba(0, 0, 0, 0) 70%)"
            : "radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(255, 255, 255, 0) 70%)",
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default VantaGlobeBG;
