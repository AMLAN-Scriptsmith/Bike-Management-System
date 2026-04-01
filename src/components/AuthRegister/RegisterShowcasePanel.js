import React from "react";
import { motion } from "framer-motion";
import { FiActivity, FiBookOpen, FiClock, FiUsers } from "react-icons/fi";

const images = {
  workshop: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1400&q=80",
  mechanic: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=900&q=80",
  delivery: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=900&q=80",
};

const points = [
  { icon: FiClock, text: "Book services in seconds" },
  { icon: FiActivity, text: "Track service progress live" },
  { icon: FiBookOpen, text: "Digital service history" },
  { icon: FiUsers, text: "Trusted by 1000+ riders" },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const RegisterShowcasePanel = () => {
  return (
    <motion.aside
      className="register-showcase"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.1, delayChildren: 0.08 }}
    >
      <div className="register-showcase-media" aria-hidden="true">
        <div className="register-showcase-overlay" />
        <img src={images.workshop} alt="" className="register-showcase-bg" />
        <img src={images.mechanic} alt="" className="register-showcase-thumb top" />
        <img src={images.delivery} alt="" className="register-showcase-thumb bottom" />
      </div>

      <motion.h1 variants={fade}>Join the Smart Bike Service Platform</motion.h1>
      <motion.p variants={fade} className="register-showcase-sub">
        Create your account to manage bookings, receive live updates, and keep every bike service detail in one place.
      </motion.p>

      <div className="register-benefits" aria-label="Platform benefits">
        {points.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div variants={fade} key={item.text} className="register-benefit-item">
              <span className="register-benefit-icon"><Icon aria-hidden="true" /></span>
              <p>{item.text}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );
};

export default RegisterShowcasePanel;
