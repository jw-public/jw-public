import * as React from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

// Parallax login background. The TweenLite animation is replaced by a CSS
// transition on background-position (mrt:gsap is gone).

export default function ParallaxLayout(): JSX.Element {
  useEffect(() => {
    document.body.classList.add("parallaxBackground");
    document.body.style.transition = "background-position 0.5s ease-out";

    const onMouseMove = (event: MouseEvent) => {
      document.body.style.backgroundPosition =
        `${event.pageX / 8}px ${event.pageY / 12}px, ` +
        `${event.pageX / 15}px ${event.pageY / 15}px, ` +
        `${event.pageX / 30}px ${event.pageY / 30}px`;
    };
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.body.classList.remove("parallaxBackground");
      document.body.style.transition = "";
      document.body.style.backgroundPosition = "";
    };
  }, []);

  return (
    <div className="container">
      <Outlet />
    </div>
  );
}
