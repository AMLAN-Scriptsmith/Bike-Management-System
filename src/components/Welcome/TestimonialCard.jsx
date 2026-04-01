import React from "react";
import MotionReveal from "./MotionReveal";

function TestimonialCard({ name, feedback, rating, delay = 0 }) {
  return (
    <MotionReveal className="testimonial-card" delay={delay}>
      <p className="testimonial-feedback">\"{feedback}\"</p>
      <div className="testimonial-meta">
        <strong>{name}</strong>
        <span>{rating} stars</span>
      </div>
    </MotionReveal>
  );
}

export default TestimonialCard;
