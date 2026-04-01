import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const defaultVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

function MotionReveal({ children, className, delay = 0, as = "div", variants, ...rest }) {
  const prefersReducedMotion = useReducedMotion();
  const Comp = motion[as] || motion.div;

  const baseVariants = prefersReducedMotion ? reducedVariants : defaultVariants;
  const resolved = variants || baseVariants;

  return (
    <Comp
      className={className}
      variants={resolved}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export default MotionReveal;
