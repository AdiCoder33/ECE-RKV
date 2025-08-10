// src/pages/LandingPage.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import Logo from "../Assets/rgukt.jpeg";
import announcements from "../Assets/rgukt.jpeg";
import aboutImage from "../Assets/hero3.jpeg"; // You'll need to add a relevant image
import achievementsImage from "../Assets/hero1.jpg"; // You'll need to add a relevant image

// Hero assets
import hero1 from "../Assets/hero1.jpg";
import hero2 from "../Assets/hero2.jpg";
import hero3 from "../Assets/hero3.jpeg";

interface Announcement {
  author: string;
  time: string;
  title: string;
  content: string;
  color: string;
}

/** Explicitly typed framer-motion variants */
const floatVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 40, damping: 12, duration: 1.0 },
  },
};
const youtubeLinks = [
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/3JZ_D3ELwOQ",
  "https://www.youtube.com/embed/L_jWHffIx5E",
];

// NEW: Theme switcher component
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // SVG icons for sun and moon
  const sunIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );

  const moonIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      {theme === "light" ? moonIcon : sunIcon}
    </button>
  );
};
const LandingPage: React.FC = () => {
  // MODIFIED: Added more announcements for auto-scrolling
  const announcementData: Announcement[] = [
    {
      author: "Dean of Academics",
      time: "12:00 22/06/2025",
      title: "Mid Time Table for E2 is announced",
      content: "Mid 2 schedule came out, so I request all the students to check it",
      color: "#E8EAF6",
    },
    {
      author: "Dean of Academics",
      time: "12:00 22/06/2025",
      title: "Lab Timetable Updated",
      content: "New lab schedule published — check your lab groups.",
      color: "#FFFDE7",
    },
    {
      author: "Dean of Academics",
      time: "12:00 22/06/2025",
      title: "Seminar on VLSI",
      content: "A department seminar on VLSI will be conducted next week.",
      color: "#FFEBEE",
    },
    {
      author: "Placement Cell",
      time: "10:30 20/06/2025",
      title: "Campus Recruitment Drive",
      content: "A major recruitment drive for final year students is scheduled next month.",
      color: "#E0F7FA",
    },
    {
      author: "Head of Department",
      time: "11:00 18/06/2025",
      title: "Project Expo Registration",
      content: "Registration for the annual project expo is now open. Submit your proposals soon!",
      color: "#F3E5F5",
    },
    {
      author: "Admin Office",
      time: "09:00 15/06/2025",
      title: "Holiday Announcement",
      content: "The college will remain closed on 25/06/2025 for a public holiday.",
      color: "#E8F5E9",
    },
    {
      author: "Sports Committee",
      time: "14:00 14/06/2025",
      title: "Annual Sports Day",
      content: "The annual sports day has been rescheduled. New dates will be announced shortly.",
      color: "#FBE9E7",
    },
  ];

  // --- Hero slider state ---
  const images = [hero1, hero2, hero3];
  // Captions for each image (one caption per image)
  const captions: { title: string; subtitle: string }[] = [
    {
      title: "Welcome to ECE Department",
      subtitle: "Innovating the future through technology, research, and collaboration.",
    },
    {
      title: "Cutting-edge Labs & Research",
      subtitle: "Hands-on IoT, VLSI and signal-processing labs empowering our students.",
    },
    {
      title: "Join Our Community",
      subtitle: "Collaborate, build, and grow — prepare for tomorrow’s challenges.",
    },
  ];

  const [current, setCurrent] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Keep track of resume timers so we can clear them on unmount
  const resumeTimerRef = useRef<number | null>(null);
  
  // NEW: Ref for the announcements container
  const announcementsRef = useRef<HTMLDivElement>(null);
  const announcementsScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Autoplay effect: runs ONLY when hovered (isPaused === true)
  useEffect(() => {
    if (!isPaused) return;
    const id = window.setInterval(() => {
      nextSlide();
    }, 2500);
    return () => window.clearInterval(id);
  }, [nextSlide, isPaused]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, []);
  
  // NEW: Auto-scroll effect for announcements
  const startAnnouncementsScroll = () => {
    if (announcementsRef.current) {
        const announcementsContainer = announcementsRef.current;
        const announcementsHeight = announcementsContainer.scrollHeight - announcementsContainer.clientHeight;
        
        // Only start scrolling if content overflows
        if (announcementsHeight > 0) {
            announcementsScrollIntervalRef.current = setInterval(() => {
                announcementsContainer.scrollTop += 1;
                // If we reach the end, reset to the top
                if (announcementsContainer.scrollTop >= announcementsHeight) {
                    announcementsContainer.scrollTop = 0;
                }
            }, 50); // Adjust speed with this value (lower is faster)
        }
    }
  };

  const stopAnnouncementsScroll = () => {
    if (announcementsScrollIntervalRef.current) {
        clearInterval(announcementsScrollIntervalRef.current);
    }
  };

  useEffect(() => {
    startAnnouncementsScroll();
    return () => stopAnnouncementsScroll();
  }, []);

  // helper to pause & resume after user interaction
  const pauseThenResume = (delay = 1000) => {
    setIsPaused(true);
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
      resumeTimerRef.current = null;
    }, delay);
  };

  const facultyList = [
    { name: "Dr. A. Kumar", title: "Professor" },
    { name: "Prof. S. Reddy", title: "Professor" },
    { name: "Dr. P. Sharma", title: "Professor" },
    { name: "Dr. M. Rao", title: "Associate Professor" },
    { name: "Ms. T. Devi", title: "Assistant Professor" },
    { name: "Mr. V. Singh", title: "Lecturer" },
  ];

  const FacultySection: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    // NEW: state to track scroll direction
    const [scrollDirection, setScrollDirection] = useState<"left" | "right">("right");

    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 160 : 220;

    const scroll = (direction: "left" | "right") => {
      if (scrollRef.current) {
        if (direction === "left") {
          scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
        }
      }
    };

    // MODIFIED: useEffect to handle bi-directional auto-scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                // If scrolled to the end on the right, switch direction to left
                if (scrollRef.current.scrollLeft + scrollRef.current.clientWidth >= scrollRef.current.scrollWidth - 10) {
                    setScrollDirection("left");
                }
                // If scrolled to the beginning on the left, switch direction to right
                if (scrollRef.current.scrollLeft <= 10) {
                    setScrollDirection("right");
                }
            }
        };

        const interval = setInterval(() => {
            scroll(scrollDirection);
        }, isMobile ? 1800 : 1200);

        scrollRef.current?.addEventListener('scroll', handleScroll);

        return () => {
            clearInterval(interval);
            scrollRef.current?.removeEventListener('scroll', handleScroll);
        };
    }, [scrollDirection, isMobile]);

    // Start auto scroll on arrow hover
    const startAutoScroll = (direction: "left" | "right") => {
      stopAutoScroll();
      scrollInterval.current = setInterval(() => scroll(direction), 100);
    };

    // Stop auto scroll
    const stopAutoScroll = () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
    };

    return (
      <motion.section
        className="bg-gray-50 py-8 px-2 sm:px-8 dark:bg-gray-900" // ADDED: dark mode class
        variants={floatVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-700 mb-6">
          Faculty
        </h2>
        <div className="relative max-w-6xl mx-auto">
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-red-700 text-white rounded-full p-2 sm:p-3 shadow-lg opacity-80 hover:opacity-100"
            onClick={() => scroll("left")}
            onMouseEnter={() => startAutoScroll("left")}
            onMouseLeave={stopAutoScroll}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          {/* Scrollable Faculty List */}
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto py-2 px-4 sm:px-8"
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {facultyList.map((fac, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 text-center min-w-[160px] sm:min-w-[220px]`} // ADDED: dark mode class
              >
                <div
                  className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gray-200 rounded-full mb-4`}
                />
                <h3 className="font-bold text-base sm:text-lg dark:text-white">
                  {fac.name}
                </h3> {/* ADDED: dark mode class */}
                <p className="text-gray-600 text-sm sm:text-base dark:text-gray-400">
                  {fac.title}
                </p>{" "}
                {/* ADDED: dark mode class */}
              </div>
            ))}
          </div>
          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-red-700 text-white rounded-full p-2 sm:p-3 shadow-lg opacity-80 hover:opacity-100"
            onClick={() => scroll("right")}
            onMouseEnter={() => startAutoScroll("right")}
            onMouseLeave={stopAutoScroll}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </motion.section>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // MODIFIED: Added dark mode class to the main container.
    // This class is a placeholder and should be handled by Tailwind's dark mode setup.
    // A better approach is to toggle a class on the `<html>` tag as implemented in ThemeToggle component.
    <div className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col m-0 p-0 transition-colors duration-300">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-8 transition-colors">
        {/* Left: Logo + Text */}
        <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
          <img src={Logo} alt="Logo" className="h-12 sm:h-16 flex-shrink-0" />

          {/* Text wraps naturally */}
          <div className="text-left tracking-wide space-y-0 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-red-700 leading-snug break-words">
              <span className="sm:hidden">Department of ECE</span>
              <span className="hidden sm:inline">
                Department of Electronics and Communication Engineering
              </span>
            </h1>

            <span className="block sm:hidden text-red-700 font-medium text-[11px] leading-snug">
              Constituted under the A.P Govt. Act 18 of 2008
            </span>
            <span className="hidden sm:block text-red-700 font-medium text-[13px] leading-snug">
              Constituted under the A.P Govt. Act 18 of 2008 and recognized as
              per Section 2(f), 12(B) of UGC Act, 1956
            </span>
          </div>
        </div>

        {/* Right: Login Button */}
        {/* MODIFIED: Added a container for the theme toggle and login button */}
        <div className="pr-2 sm:pr-6 mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-4">
          <ThemeToggle /> {/* ADDED: The new theme toggle component */}
          <Link
            to="/login"
            aria-label="Login"
            className="bg-red-700 text-white font-bold rounded-md shadow-md hover:bg-red-800 transition-colors
                  py-1.5 px-3 text-sm md:py-3 md:px-8 md:text-base tracking-wide"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed top-4 right-4 z-50 bg-red-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-800 transition"
          aria-label="Scroll to top"
        >
          ↑ Top
        </button>
      )}

      {/* HERO SECTION */}
      <section
        role="region"
        aria-label="Hero carousel"
        className="relative w-full h-[350px] sm:h-[500px] overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Sliding images */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`ECE hero ${idx + 1}`}
              className="w-full h-[350px] sm:h-[600px] object-cover flex-shrink-0"
            />
          ))}
        </div>

        {/* Left arrow - hidden until hover */}
        <button
          type="button"
          onClick={prevSlide} // Remove pauseThenResume here
          aria-label="Previous slide"
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 shadow-lg select-none focus:outline-none transition-opacity opacity-0 group-hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Right arrow - hidden until hover */}
        <button
          type="button"
          onClick={nextSlide} // Remove pauseThenResume here
          aria-label="Next slide"
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 shadow-lg select-none focus:outline-none transition-opacity opacity-0 group-hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => {
                setCurrent(idx);
                pauseThenResume(1000); // Only pause/resume when clicking indicators
              }}
              className={`w-4 h-4 rounded-full transition-transform focus:outline-none ${
                idx === current
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Animated per-image captions (transparent background so image is visible) */}
       {/* Animated per-image captions (transparent background so image is visible) */}
<div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 pointer-events-none">
  {captions.map((cap, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={
        idx === current ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
      }
      transition={{ duration: 0.6 }}
      className={`w-full flex flex-col items-center justify-center absolute left-0 right-0 px-4`}
    >
      {/* transparent bluish backdrop for readability but very light */}
      <h2 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md select-none">
        {" "}
        {cap.title}{" "}
      </h2>{" "}
      <p className="mt-3 max-w-2xl text-sm sm:text-lg text-white/95 select-none">
        {" "}
        {cap.subtitle}{" "}
      </p>
    </motion.div>
  ))}
</div>
      </section>

      {/* NAVIGATION */}

      {/* ANNOUNCEMENTS */}
      <main className="flex-grow w-full flex flex-col items-start px-2 sm:px-4 py-4 md:px-16">
        {/* Remove motion.div and floating effect from Announcements section */}
        <div className="w-full max-w-6xl">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Announcements - Left Side */}
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-700 mb-4 text-left">
                Latest Announcements
              </h2>
              {/* MODIFIED: Added ref, overflow, max-height, and event handlers for auto-scroll */}
              <div
                ref={announcementsRef}
                className="space-y-4 sm:space-y-6 max-h-[550px] overflow-y-auto pr-2"
                onMouseEnter={stopAnnouncementsScroll}
                onMouseLeave={startAnnouncementsScroll}
              >
                {announcementData.map((notice, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border-l-4 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 transition hover:shadow-xl text-left" // ADDED: dark mode class
                    style={{ borderLeftColor: notice.color }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
                      <span className="font-semibold text-red-700 text-sm sm:text-base">
                        {notice.author}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notice.time}
                      </span>{" "}
                      {/* ADDED: dark mode class */}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-1">
                      {notice.title}
                    </h3>{" "}
                    {/* ADDED: dark mode class */}
                    <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                      {notice.content}
                    </p>{" "}
                    {/* ADDED: dark mode class */}
                    <a
                      href="#"
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      View More
                    </a>
                  </div>
                ))}
              </div>
            </div>
            {/* Right Side Panel */}
            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-4 justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 mt-8 md:mt-16">
                {" "}
                {/* ADDED: dark mode class */}
                <h3 className="text-base sm:text-lg font-bold text-red-700 mb-2 sm:mb-3">
                  Quick Links
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Academic Calendar
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Exam Schedules
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Faculty Directory
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Student Portal
                    </a>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">
                {" "}
                {/* ADDED: dark mode class */}
                <h3 className="text-base sm:text-lg font-bold text-red-700 mb-2 sm:mb-3">
                  Upcoming Events
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {" "}
                  {/* ADDED: dark mode class */}
                  <li>VLSI Seminar - 28/08/2025</li>
                  <li>Hackathon Registration - 01/09/2025</li>
                  <li>Lab Group Meeting - 05/09/2025</li>
                </ul>
              </div>
              {/* Creative Card */}
              <div className="bg-gradient-to-r from-red-100 via-blue-100 to-green-100 dark:from-red-900 dark:via-blue-900 dark:to-green-900 rounded-xl shadow-lg p-4 flex flex-col items-center justify-center mt-2">
                {" "}
                {/* ADDED: dark mode class */}
                <svg
                  className="w-8 h-8 text-red-700 mb-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {" "}
                  {/* ADDED: dark mode class */}
                  "Empowering innovation and excellence in every student.{" "}
                  <br className="hidden sm:block" /> Dream big, achieve bigger!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* COMBINED ABOUT & ACHIEVEMENTS SECTION */}
      <motion.section 
        className="bg-white dark:bg-gray-800 py-12 px-4 sm:px-8" 
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* About the Department - Left Side */}
          <div className="text-center md:text-left order-2 md:order-1">
            <h2 className="text-3xl font-bold text-red-700 mb-4">About the Department</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              The Department of Electronics and Communication Engineering (ECE) at RGUKT is committed to providing quality education and fostering innovation in areas such as Communication Systems, VLSI, Embedded Systems, and Signal Processing. Our mission is to prepare students for successful careers in industry, academia, and research.
            </p>
            <div className="bg-red-700 text-white rounded-lg p-4 shadow-md mt-4">
              <h3 className="font-bold text-lg">Our Vision</h3>
              <p className="text-sm mt-1">To be a center of excellence in ECE, fostering creative and innovative engineers for global challenges.</p>
            </div>
          </div>
          {/* About Image - Right Side */}
          <div className="order-1 md:order-2">
            <img 
              src={aboutImage} 
              alt="Students in the ECE lab" 
              className="w-full h-auto object-cover rounded-lg shadow-xl" 
            />
          </div>
        </div>
      </motion.section>

      {/* ACHIEVEMENTS SECTION */}
      <motion.section 
        className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-8" 
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
           {/* Achievements Image - Left Side */}
           <div>
            <img 
              src={achievementsImage} 
              alt="Achievements" 
              className="w-full h-auto object-cover rounded-lg shadow-xl" 
            />
          </div>
          {/* Achievements - Right Side */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-red-700 mb-6">Department Achievements</h2>
            <ul className="list-none text-left space-y-4">
              <li className="flex items-start">
                <span className="text-red-700 text-2xl mr-3 font-bold">⭐</span>
                <p className="text-gray-700 dark:text-gray-300">
                  **Top Ranks in Competitive Exams:** Our students have consistently secured top ranks in national-level exams like **GATE**, **IES**, and others.
                </p>
              </li>
              <li className="flex items-start">
                <span className="text-red-700 text-2xl mr-3 font-bold">🏆</span>
                <p className="text-gray-700 dark:text-gray-300">
                  **Research and Publications:** Our faculty and students have published over 50 research papers in renowned international journals and conferences.
                </p>
              </li>
              <li className="flex items-start">
                <span className="text-red-700 text-2xl mr-3 font-bold">💡</span>
                <p className="text-gray-700 dark:text-gray-300">
                  **State-of-the-Art Labs:** We have established cutting-edge laboratories for **IoT**, **VLSI**, and **Signal Processing**, providing hands-on experience.
                </p>
              </li>
              <li className="flex items-start">
                <span className="text-red-700 text-2xl mr-3 font-bold">💻</span>
                <p className="text-gray-700 dark:text-gray-300">
                  **Innovation and Hackathons:** Active participation and victories in national hackathons and innovation contests, showcasing our students' problem-solving skills.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Move Faculty Section here, just above the footer */}
      <FacultySection />

      {/* FOOTER */}
      <footer className="bg-red-700 text-white py-6 md:py-2 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
          <div>
            <h3 className="font-bold text-lg">
              Department of Electronics and Communication Engineering
            </h3>
            <p className="text-sm">
              Rajiv Gandhi University of Knowledge Technologies - RK Valley
            </p>
            <p className="text-xs mt-1">
              © {new Date().getFullYear()} All Rights Reserved.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-4">
            <a href="#" className="hover:underline text-sm">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline text-sm">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;