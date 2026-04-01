import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiDroplet,
  FiGrid,
  FiMapPin,
  FiSettings,
  FiShield,
  FiTool,
  FiTruck,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  FeatureCard,
  HowStepCard,
  MotionReveal,
  RoleCard,
  SectionHeader,
  ServiceCard,
  TestimonialCard,
} from "../../components/Welcome";
import { useAuth } from "../../context/AuthContext";
import "./Welcome.scss";

const heroImages = {
  workshop: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1400&q=80",
  diagnostics: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80",
  delivery: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=900&q=80",
};

const detailImageOne = "https://www.shutterstock.com/image-photo/helsinki-finlandcirca-apr-2018-new-600nw-1664157934.jpg";
const detailImageTwo = "https://media.istockphoto.com/id/1197932659/photo/biker-repairing-his-motorcycle.jpg?s=612x612&w=0&k=20&c=C1aoE_c9YLwjfID3OfsapgW0nWfWXXqJVoq13kI46jQ=";

const features = [
  {
    title: "Smart Booking",
    detail: "Customers can schedule service slots in seconds with transparent timelines and instant confirmations.",
    icon: FiClock,
  },
  {
    title: "Live Workshop Updates",
    detail: "Real-time status updates keep customers and managers informed as technicians progress through each task.",
    icon: FiActivity,
  },
  {
    title: "Unified Service Records",
    detail: "Keep complete history for bike diagnostics, invoices, parts, and service quality in a single dashboard.",
    icon: FiGrid,
  },
];

const services = [
  { title: "General Service", icon: FiSettings },
  { title: "Engine Repair", icon: FiTool },
  { title: "Oil Change", icon: FiDroplet },
  { title: "Brake Inspection", icon: FiShield },
  { title: "Battery Check", icon: FiZap },
  { title: "Washing & Detailing", icon: FiCompass },
];

const steps = [
  { title: "Book Service", icon: FiCalendar },
  { title: "Get Confirmation", icon: FiCheckCircle },
  { title: "Live Tracking", icon: FiMapPin },
  { title: "Service Completion", icon: FiTool },
  { title: "Delivery", icon: FiTruck },
];

const roleFeatures = [
  {
    role: "Customer",
    icon: FiUser,
    points: ["Book and reschedule services", "Track bike status live", "View invoices and service history"],
  },
  {
    role: "Receptionist",
    icon: FiBriefcase,
    points: ["Register customers and bikes", "Create job cards quickly", "Generate invoices and collect payments"],
  },
  {
    role: "Technician",
    icon: FiTool,
    points: ["Update job progress in real time", "Request spare parts instantly", "Upload notes and completion evidence"],
  },
  {
    role: "Manager",
    icon: FiUsers,
    points: ["Assign technicians smartly", "Monitor daily workshop performance", "Review inventory and operational reports"],
  },
];

const testimonials = [
  {
    name: "Rahul Verma",
    feedback: "Booking was simple and I could track every update. The bike was delivered exactly on time.",
    rating: "4.9",
  },
  {
    name: "Anjali Nair",
    feedback: "The dashboard is super clear. I received transparent billing and service notes without follow-up calls.",
    rating: "4.8",
  },
  {
    name: "Sameer Khan",
    feedback: "Great workshop coordination. My brake issue was diagnosed and fixed fast with complete visibility.",
    rating: "4.8",
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleBookService = (serviceTitle = "General Service") => {
    if (token) {
      navigate("/dashboard", {
        state: {
          source: "welcome",
          action: "book-service",
          serviceType: serviceTitle,
        },
      });
      return;
    }

    navigate("/register", {
      state: {
        source: "welcome",
        preferredServiceType: serviceTitle,
      },
    });
  };

  const scrollToServices = () => {
    const section = document.getElementById("services");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="landing-page">
      <section className="welcome-page" aria-label="Welcome Hero">
        <div className="welcome-overlay" />

        <MotionReveal className="welcome-content">
          <p className="welcome-kicker">Bike Service Platform</p>
          <h1>Modern Bike Service Management For Faster Workshop Operations</h1>
          <p className="welcome-subtitle">
            Streamline bookings, workshop updates, diagnostics, and delivery communication from one professional SaaS-style platform.
          </p>

          <div className="welcome-actions">
            <button
              type="button"
              className="welcome-btn welcome-btn-primary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="welcome-btn welcome-btn-outline"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
            <button
              type="button"
              className="welcome-btn welcome-btn-secondary"
              onClick={() => {
                scrollToServices();
                handleBookService("General Service");
              }}
            >
              Book Service <FiArrowRight aria-hidden="true" />
            </button>
          </div>

          <div className="welcome-trust" role="list" aria-label="Trust indicators">
            <div>
              <strong>Trusted by 1000+ customers</strong>
              <span>Across daily servicing and repairs</span>
            </div>
            <div>
              <strong>Rated 4.8 stars</strong>
              <span>Consistent workshop experience</span>
            </div>
          </div>
        </MotionReveal>

        <MotionReveal className="welcome-image-stack" aria-hidden="true" delay={0.12}>
          <div className="welcome-image-card main">
            <img
              src={heroImages.workshop}
              alt="Mechanic repairing a bike in a workshop"
            />
          </div>
          <div className="welcome-image-card secondary">
            <img
              src={heroImages.diagnostics}
              alt="Technician performing bike diagnostics and inspection"
            />
          </div>
          <div className="welcome-image-card tertiary">
            <img
              src={heroImages.delivery}
              alt="Customer receiving serviced motorcycle from workshop"
            />
          </div>
        </MotionReveal>
      </section>

      <section className="landing-section landing-features" aria-label="Core features">
        <SectionHeader
          title="Built For End-To-End Service Visibility"
          subtitle="Everything your workshop needs from intake to delivery in one integrated workflow."
        />
        <div className="feature-grid">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} delay={index * 0.08} />
          ))}
        </div>
      </section>

      <section id="services" className="landing-section landing-services" aria-label="Services">
        <SectionHeader
          title="Service Offerings"
          subtitle="Professional care plans for every bike condition and maintenance requirement."
        />
        <div className="service-grid">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              {...service}
              delay={index * 0.06}
              onBook={() => handleBookService(service.title)}
            />
          ))}
        </div>
      </section>

      <section className="landing-section landing-how" aria-label="How it works">
        <SectionHeader title="How It Works" subtitle="A transparent 5-step journey from booking to delivery." />
        <ol className="how-grid">
          {steps.map((step, index) => {
            return (
              <HowStepCard
                key={step.title}
                title={step.title}
                icon={step.icon}
                index={index + 1}
                delay={index * 0.06}
              />
            );
          })}
        </ol>
      </section>

      <section className="landing-section landing-details" aria-label="Why this platform helps workshops">
        <MotionReveal className="detail-text">
          <h2>Why This Website Helps Your Workshop Grow</h2>
          <p>
            Handle daily operations without confusion. The platform reduces manual follow-ups by giving each role
            exactly what they need: customers get transparency, reception handles job cards quickly, managers monitor
            workflow, and technicians update progress instantly.
          </p>
          <p>
            With a single source of truth for service records, stock, and requests, your team can deliver faster,
            cleaner service with better customer trust.
          </p>
        </MotionReveal>

        <MotionReveal className="detail-gallery" aria-hidden="true" delay={0.1}>
          <img
            src={detailImageOne}
            alt="New motorcycle lineup in workshop showroom"
          />
          <img
            src={detailImageTwo}
            alt="Mechanic repairing a motorcycle with precision tools"
          />
        </MotionReveal>
      </section>

      <section className="landing-section landing-roles" aria-label="Role based features">
        <SectionHeader
          title="Role-Based Feature Access"
          subtitle="Each role gets focused capabilities for speed, accountability, and quality service output."
        />
        <div className="role-grid">
          {roleFeatures.map((item, index) => (
            <RoleCard key={item.role} {...item} delay={index * 0.07} />
          ))}
        </div>
      </section>

      <section className="landing-section landing-testimonials" aria-label="Testimonials">
        <SectionHeader
          title="What Customers Say"
          subtitle="Real feedback from riders who used the platform for regular service and urgent repairs."
        />
        <div className="testimonial-grid">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} {...testimonial} delay={index * 0.08} />
          ))}
        </div>
      </section>

      <section className="landing-section landing-cta" aria-label="Get started">
        <MotionReveal as="article" className="cta-banner">
          <div>
            <p className="cta-kicker">Workshop Growth Starts Here</p>
            <h2>Ready to simplify your bike servicing?</h2>
          </div>
          <button type="button" className="welcome-btn welcome-btn-primary" onClick={() => navigate("/register")}>Get Started Today</button>
        </MotionReveal>
      </section>
    </div>
  );
};

export default Welcome;
