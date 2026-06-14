"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const GlowContext = createContext(null);

export function useGlowContext() {
  return useContext(GlowContext);
}

export function GlowProvider({ children }) {
  const lastCardRef = useRef(null);
  const lastCardCenter = useRef(null);
  const [bridge, setBridge] = useState(null);
  const bridgeTimerRef = useRef(null);

  const registerCard = useCallback((el, center) => {
    lastCardRef.current = el;
    lastCardCenter.current = center;
  }, []);

  const triggerBridge = useCallback((fromCenter, toCenter, toEl) => {
    if (bridgeTimerRef.current) clearTimeout(bridgeTimerRef.current);

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    setBridge({
      x: fromCenter.x,
      y: fromCenter.y,
      angle,
      distance,
      key: Date.now(),
    });

    bridgeTimerRef.current = setTimeout(() => {
      setBridge(null);
    }, 350);
  }, []);

  useEffect(() => {
    return () => {
      if (bridgeTimerRef.current) clearTimeout(bridgeTimerRef.current);
    };
  }, []);

  return (
    <GlowContext.Provider value={{ registerCard, lastCardRef, lastCardCenter }}>
      {children}
      {bridge && <BridgeLine {...bridge} />}
    </GlowContext.Provider>
  );
}

function BridgeLine({ x, y, angle, distance, key }) {
  return createPortal(
    <div
      key={key}
      className="glow-bridge"
      style={{
        left: x,
        top: y,
        transform: `rotate(${angle}deg)`,
        "--bridge-width": `${distance}px`,
      }}
    />,
    document.body
  );
}

export default function GlowCard({ children, className = "", as = "div", ...props }) {
  const ctx = useGlowContext();
  const cardRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const entryAngleRef = useRef(0);

  const handleMouseEnter = useCallback(() => {
    if (!ctx || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const prev = ctx.lastCardCenter.current;
    if (prev) {
      const dx = center.x - prev.x;
      const dy = center.y - prev.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
      entryAngleRef.current = angle;

      ctx.triggerBridge(prev, center, cardRef.current);

      setIsEntering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsEntering(false);
        });
      });
    }

    ctx.registerCard(cardRef.current, center);
    setIsActive(true);
  }, [ctx]);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  const Tag = as;
  const classes = `glow-card ${isActive ? "glow-active" : ""} ${isEntering ? "glow-entering" : ""} ${className}`;

  return (
    <Tag
      ref={cardRef}
      className={classes}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ "--glow-entry": `${entryAngleRef.current}deg` }}
      {...props}
    >
      {children}
    </Tag>
  );
}
