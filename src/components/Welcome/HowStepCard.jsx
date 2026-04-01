import React from "react";
import MotionReveal from "./MotionReveal";

function HowStepCard({ icon: Icon, title, index, delay = 0 }) {
  return (
    <MotionReveal as="li" className="how-step" delay={delay}>
      <div className="how-icon" aria-hidden="true"><Icon /></div>
      <p className="how-index">Step {index}</p>
      <h3>{title}</h3>
    </MotionReveal>
  );
}

export default HowStepCard;
