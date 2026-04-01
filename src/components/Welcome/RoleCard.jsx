import React from "react";
import MotionReveal from "./MotionReveal";

function RoleCard({ role, icon: Icon, points, delay = 0 }) {
  return (
    <MotionReveal className="role-card" delay={delay}>
      <div className="role-title"><Icon aria-hidden="true" /> <h3>{role}</h3></div>
      <ul>
        {points.map((point) => <li key={point}>{point}</li>)}
      </ul>
    </MotionReveal>
  );
}

export default RoleCard;
