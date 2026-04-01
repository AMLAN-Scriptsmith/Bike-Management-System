import React from "react";
import MotionReveal from "./MotionReveal";

function ServiceCard({ icon: Icon, title, delay = 0, onBook }) {
  return (
    <MotionReveal
      className="service-card"
      delay={delay}
      as="button"
      onClick={onBook}
      type="button"
      aria-label={`Book ${title}`}
    >
      <div className="service-icon" aria-hidden="true"><Icon /></div>
      <h3>{title}</h3>
      <p className="service-book-action">Book this service</p>
    </MotionReveal>
  );
}

export default ServiceCard;
