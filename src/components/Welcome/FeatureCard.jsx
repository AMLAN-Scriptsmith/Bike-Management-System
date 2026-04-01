import React from "react";
import MotionReveal from "./MotionReveal";

function FeatureCard({ icon: Icon, title, detail, delay = 0 }) {
  return (
    <MotionReveal className="feature-card" delay={delay}>
      <div className="feature-icon" aria-hidden="true"><Icon /></div>
      <h3>{title}</h3>
      <p>{detail}</p>
    </MotionReveal>
  );
}

export default FeatureCard;
