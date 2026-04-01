import React from "react";
import MotionReveal from "./MotionReveal";

function SectionHeader({ title, subtitle }) {
  return (
    <MotionReveal className="section-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </MotionReveal>
  );
}

export default SectionHeader;
