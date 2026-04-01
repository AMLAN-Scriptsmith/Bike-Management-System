import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiShield, FiTrendingUp } from "react-icons/fi";

const images = {
  workshop: "https://tse4.mm.bing.net/th/id/OIP.7A6v2bwRoyRs0VoSVBckSAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3",
  mechanic: "https://th.bing.com/th/id/R.c3dce07b33b22153a5b94fe5bfc8c504?rik=AvfKgAIhRkLb5Q&riu=http%3a%2f%2fretaildesignblog.net%2fwp-content%2fuploads%2f2017%2f06%2fFrench-colorful-bike-showroom-by-Carl-Tran-Toulon-France18.jpg&ehk=%2bcKcd0NYQidcrsA8w1n31rj4IO%2bsbERXfcBv2MWx9Ow%3d&risl=&pid=ImgRaw&r=0",
  delivery: "https://tse4.mm.bing.net/th/id/OIP.FHw-wKIgDt35xxwtHcDGYgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3",
};

const badgeItems = [
  "1000+ Happy Customers",
  "4.8★ Service Rating",
  "Used by Professional Workshops",
];

const benefits = [
  {
    title: "Track Service Status Live",
    text: "Instant visibility for bookings, diagnostics, repairs, and delivery timelines.",
    icon: FiCheckCircle,
  },
  {
    title: "Manage Inventory Efficiently",
    text: "Control spare parts usage and stock movement without manual confusion.",
    icon: FiTrendingUp,
  },
  {
    title: "Improve Customer Satisfaction",
    text: "Deliver clear updates, transparent pricing, and consistent workshop quality.",
    icon: FiShield,
  },
];

const fadeItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const ShowcasePanel = () => {
  return (
    <motion.aside
      className="login-showcase"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
    >
      <div className="showcase-media" aria-hidden="true">
        <div className="showcase-overlay" />
        <img src={images.workshop} alt="" className="showcase-bg" />
        <img src={images.mechanic} alt="" className="showcase-thumb thumb-top" />
        <img src={images.delivery} alt="" className="showcase-thumb thumb-bottom" />
      </div>

      <motion.p variants={fadeItem} className="login-kicker">Trusted Bike Care</motion.p>
      <motion.h1 variants={fadeItem}>Welcome Back to Your Smart Service Dashboard</motion.h1>
      <motion.p variants={fadeItem} className="showcase-lead">
        Manage service requests, parts inventory, technician assignments, and customer communication from one
        premium operations center.
      </motion.p>

      <motion.div variants={fadeItem} className="trust-badges" role="list" aria-label="Trust badges">
        {badgeItems.map((item) => (
          <span key={item} role="listitem">{item}</span>
        ))}
      </motion.div>

      <div className="login-highlights" aria-label="Benefits">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <motion.article key={benefit.title} variants={fadeItem} className="benefit-card">
              <div className="benefit-icon" aria-hidden="true"><Icon /></div>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </motion.article>
          );
        })}
      </div>

      <motion.p variants={fadeItem} className="security-note">
        Your data is secure and encrypted.
      </motion.p>
    </motion.aside>
  );
};

export default ShowcasePanel;
