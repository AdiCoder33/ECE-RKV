// src/pages/LandingPage.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Logo from "../Assets/rgukt.jpeg";
import aboutImage from "../Assets/hero3.jpeg"; // You'll need to add a relevant image
import achievementsImage from "../Assets/hero1.jpg"; // You'll need to add a relevant image
import heroimage1 from "../Assets/hero2.jpg";
import heroimage2 from "../Assets/hero3.jpeg";
import heroimage3 from "../Assets/hero1.jpg";
// Hero assets
import department_img from "../Assets/welcom_images/department_img.jpg";
import director_and_co from "../Assets/welcom_images/director_and_co.jpg";
import hero3 from "../Assets/hero3.jpeg";
import department2 from "../Assets/department2.jpg";

// Achievement images
import achievement1 from "../Assets/achivements/avhivement1.jpeg";
import achievement2 from "../Assets/achivements/achivement2.jpeg";
import achievement3 from "../Assets/achivements/achivement3.jpeg";

// Announcement illustration
import announcementIllustration from "../Assets/Announcement-Illustration.png";

// Lab facility images
import lab1Image from "../Assets/lab_facilities/lab1.jpg";
import lab2Image from "../Assets/lab_facilities/lab2.jpg";
import lab3Image from "../Assets/lab_facilities/lab3.jpg";

// Faculty images - imported directly
import arunKumarReddy from "../Assets/faculty/arun_kumar_reddy.jpg";
import sudhakarReddy from "../Assets/faculty/sudhakar_reddy.jpg";
import lakshmiShirisha from "../Assets/faculty/lakshmi_shirisha.jpg";
import lakshmiPrasanna from "../Assets/faculty/lakshmi_prasanna.jpg";
import abdulMunaf from "../Assets/faculty/abdul_munaf.jpg";
import mAnitha from "../Assets/faculty/m_anitha.jpg";
import madhanMohan from "../Assets/faculty/madhan_mohan.jpg";
import mohanRaju from "../Assets/faculty/mohan_raju.jpg";
import naresh from "../Assets/faculty/naresh.jpg";
import pavanKumar from "../Assets/faculty/pavan_kumar.jpg";
import safariBhaskarRao from "../Assets/faculty/safari_bhaskar_rao.jpg";
import shaikRiyazum from "../Assets/faculty/shaik_riyazum.jpg";
import shivaKrishna from "../Assets/faculty/shiva_krishna.jpg";
import krishnamHarinathReddy from "../Assets/faculty/krishnam_harinath_reddy.jpg";
import janardhanReddy from "../Assets/faculty/janardhan_reddy.jpg";
import venkatesulu from "../Assets/faculty/venkatesulu.jpg";
//icon imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

interface Announcement {
  author: string;
  time: string;
  title: string;
  content: string;
  targetRole: string;
}

/** Explicitly typed framer-motion variants */
const floatVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 20, duration: 0.4 },
  },
};

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
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${apiBase}/public/announcements?scope=landing`);
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data: Array<Record<string, unknown>> = await response.json();
        const mapped: Announcement[] = data
          .map((a) => ({
            author: (a.author_name as string) || (a.authorName as string) || 'Unknown',
            time: new Date((a.created_at as string) || (a.createdAt as string)).toLocaleString('en-IN'),
            title: a.title as string,
            content: a.content as string,
            targetRole: (a.target_role as string) || (a.targetRole as string) || '',
          }))
          .filter((a) => a.targetRole === 'landing');
        setAnnouncements(mapped);
      } catch (error) {
        console.error('Error fetching announcements', error);
      }
    };

    fetchAnnouncements();
  }, [apiBase]);

  // --- Hero slider state ---
  const images = [department_img, director_and_co, hero3];
  // Captions for each image (one caption per image)
  const captions: { title: string; subtitle: string }[] = [
    {
      title: "Our Department",
      subtitle: "Excellence in Electronics and Communication Engineering education and research.",
    },
    {
      title: "Leadership Team",
      subtitle: "Dedicated faculty and administration guiding our students to success.",
    },
    {
      title: "Join Our Community",
      subtitle: "Collaborate, Build and Grow for tomorrow challenges",
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
    stopAnnouncementsScroll();
    startAnnouncementsScroll();
    return () => stopAnnouncementsScroll();
  }, [announcements]);

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
    { name: "Mr. Y Arun Kumar Reddy", title: "Head of the department", image: arunKumarReddy },
    { name: "Mr. B. V. Sudhakar Reddy", title: "Assistant Professor", image: sudhakarReddy },
    { name: "Ms. G. Lakshmi Shireesha", title: "Assistant Professor", image: lakshmiShirisha },
    { name: "Mr. Janardhan. Reddy", title: "Assistant Professor", image: janardhanReddy },
    { name: "Mrs. V Lakshmi Prasanna", title: "Assistant Professor", image: lakshmiPrasanna },
    { name: "Mr. P. Siva Krishna", title: "Assistant Professor", image: shivaKrishna },
    { name: "Mr. K. Abdul Munaf", title: "Assistant Professor", image: abdulMunaf },
    { name: "Mrs. M. Anitha", title: "Assistant Professor", image: mAnitha },
    { name: "Mr. B Madhan Mohan", title: "Assistant Professor", image: madhanMohan },
    { name: "Mr. N Mohan Raju", title: "Assistant Professor", image: mohanRaju },
    { name: "Mr. T Naresh", title: "Assistant Professor", image: naresh },
    { name: "Mr. R. Pavan kumar", title: "Assistant Professor", image: pavanKumar },
    { name: "Mr. SAFARI BHASKAR RAO", title: "Assistant Professor", image: safariBhaskarRao },
    { name: "Mrs. SHAIK RIAZUM", title: "Assistant Professor", image: shaikRiyazum },
    { name: "Mr. K. Harinath Reddy", title: "Assistant Professor", image: krishnamHarinathReddy },
    { name: "Mr. Venkatesulu", title: "Assistant Professor", image: venkatesulu },
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
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-700 mb-6">
          Faculty
        </h2>
        <div className="relative max-w-7xl mx-auto">
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
                {fac.image ? (
                  <img src={fac.image} alt={fac.name}
                    className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full mb-4 object-cover"
                  />
                ) : (
                  <div
                    className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gray-200 rounded-full mb-4`}
                  />
                )}
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
   ) };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // NEW: Achievements Data for the carousel
  const achievementsData = [
    {
      icon: "🏆",
      title: "National-Level Hackathon Winners",
      description: "Our student team 'Innovators' secured the first place in the National Smart India Hackathon.",
      image: achievement1
    },
    {
      icon: "🔬",
      title: "Patents Filed by Faculty",
      description: "Two of our faculty members have successfully filed patents for their research on IoT-based energy systems.",
      image: achievement2,
    },
    {
      icon: "🚀",
      title: "Record Placements in 2024",
      description: "The ECE department achieved a record-high placement percentage of 98% in top-tier companies.",
      image: achievement3,
    },
  ];

  // NEW: Achievements Carousel Component
  const AchievementsCarousel: React.FC = () => {
    const [currentAchievement, setCurrentAchievement] = useState(0);
    const achievementsIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      achievementsIntervalRef.current = setInterval(() => {
        setCurrentAchievement((prev) => (prev + 1) % achievementsData.length);
      }, 4000); // Change slide every 4 seconds

      return () => {
        if (achievementsIntervalRef.current) {
          clearInterval(achievementsIntervalRef.current);
        }
      };
    }, [achievementsData.length]);

    const achievementVariants: Variants = {
      enter: { opacity: 0, scale: 0.95, x: 100 },
      center: { opacity: 1, scale: 1, x: 0 },
      exit: { opacity: 0, scale: 0.95, x: -100 },
    };

    return (
      <div className="relative w-full h-[420px] sm:h-[480px] md:h-[520px] lg:h-[560px] xl:h-[600px] overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-red-100 via-yellow-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAchievement}
            className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 sm:p-8"
            variants={achievementVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <img
              src={achievementsData[currentAchievement].image}
              alt={achievementsData[currentAchievement].title}
              className="w-full h-[180px] sm:h-[260px] md:h-[320px] lg:h-[380px] xl:h-[420px] object-contain rounded-xl shadow-lg mb-4 border-4 border-white dark:border-gray-800"
            />
            <div className="text-5xl mb-2">{achievementsData[currentAchievement].icon}</div>
            <h3 className="text-xl sm:text-2xl font-bold text-red-700 dark:text-yellow-300 mb-1">{achievementsData[currentAchievement].title}</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg">{achievementsData[currentAchievement].description}</p>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {achievementsData.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === currentAchievement ? "bg-red-700" : "bg-gray-400"
              }`}
              onClick={() => setCurrentAchievement(idx)}
              aria-label={`Show achievement ${idx + 1}`}
            />
          ))}
        </div>
        {/* Creative sparkle effect */}
        <div className="absolute top-2 right-2 animate-pulse">
          <svg width="244" height="24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#FBBF24" opacity="0.7"/>
            <circle cx="18" cy="6" r="1.5" fill="#F87171" opacity="0.7"/>
            <circle cx="6" cy="18" r="1" fill="#60A5FA" opacity="0.7"/>
          </svg>
        </div>
      </div>
    );
  };
  
  // NEW: Message from HOD component to fill the gap
  const MessageFromHOD: React.FC = () => (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transition-colors"
      variants={floatVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h3 className="text-lg font-bold text-red-700 mb-2">Message from the HOD</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        "Our department is a hub of innovation and collaboration. We are committed to nurturing the next generation of engineers and leaders. We encourage every student to explore their potential and contribute to the world of technology."
      </p>
      <div className="mt-4 text-right">
        <p className="font-semibold text-red-700">Dr. V. Prasad</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Head of Department, ECE</p>
      </div>
    </motion.div>
  );


  return (
    // MODIFIED: Added dark mode class to the main container.
    // This class is a placeholder and should be handled by Tailwind's dark mode setup.
    // A better approach is to toggle a class on the <html> tag as implemented in ThemeToggle component.
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
      <motion.main 
        className="flex-grow w-full flex flex-col items-start px-2 sm:px-4 py-4 md:px-16 lg:px-20 xl:px-24"
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.1 }}
      >
          <div className="w-full max-w-7xl">
    {/* Announcements and Quick Links side by side on desktop, stacked on mobile */}
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 xl:gap-16 items-start">
      {/* Announcements - Left Side */}
      <div className="flex-1">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-red-700 mb-3 lg:mb-4 xl:mb-6 text-left">
          Latest Announcements
        </h2>
        <div
          ref={announcementsRef}
          className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-5 max-h-[280px] lg:max-h-[320px] xl:max-h-[360px] overflow-y-auto pr-2"
          onMouseEnter={stopAnnouncementsScroll}
          onMouseLeave={startAnnouncementsScroll}
        >
          {announcements.map((notice, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-md p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 transition hover:shadow-lg text-left"
              style={{ borderLeftColor: '#E8EAF6' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                <span className="font-semibold text-red-700 text-xs sm:text-xs lg:text-sm xl:text-base">
                  {notice.author}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 lg:text-xs xl:text-sm">
                  {notice.time}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-gray-800 dark:text-white mb-1">
                {notice.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-1 text-xs sm:text-xs lg:text-sm xl:text-base">
                {notice.content}
              </p>
              <a
                href="#"
                className="text-xs text-blue-600 hover:underline font-medium lg:text-xs xl:text-sm"
              >
                View More
              </a>
            </div>
          ))}
        </div>
      </div>
      {/* Announcement Illustration - Right Side (Hidden on mobile) */}
      <div className="hidden md:block md:w-80 lg:w-96 xl:w-[28rem] 2xl:w-[28rem] flex-shrink-0 flex flex-col justify-center pt-6 md:pt-16 lg:pt-20 xl:pt-24 h-full">
        <img 
          src={announcementIllustration} 
          alt="Announcement illustration" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
      </div>
      </motion.main>
      {/* COMBINED ABOUT & ACHIEVEMENTS SECTION */}
      <motion.section 
        className="bg-white dark:bg-gray-800 py-12 px-4 sm:px-8" 
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* About the Department - Left Side */}
          <div className="text-center md:text-left order-1">
            <h2 className="text-3xl font-bold text-red-700 mb-4">About the Department</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              The Department of Electronics and Communication Engineering (ECE) at RGUKT is committed to providing quality education and fostering innovation in areas such as Communication Systems, VLSI, Embedded Systems, and Signal Processing. Our mission is to prepare students for successful careers in industry, academia, and research.
            </p>
            <div className="bg-red-500 text-white rounded-lg p-4 shadow-md mt-4">
              <h3 className="font-bold text-lg">Our Vision</h3>
              <p className="text-sm mt-1">To be a center of excellence in ECE, fostering creative and innovative engineers for global challenges.</p>
            </div>
          </div>
          {/* About Image - Right Side */}
          <div className="order-2">
            <img 
              src={department2} 
              alt="Department of Electronics and Communication Engineering" 
              className="w-full h-auto object-cover rounded-lg shadow-xl" 
            />
          </div>
        </div>
      </motion.section>

      {/* LAB FACILITIES SECTION */}
      <motion.section 
        className="bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-8" 
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-red-700 mb-12 text-center">Lab Facilities</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group">
              <div className="relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={lab1Image} 
                  alt="Lab Facility 1" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">Advanced Electronics Lab</h3>
                  <p className="text-sm text-gray-200">State-of-the-art equipment for electronics research</p>
                </div>
              </div>
            </div>
            <div className="group">
              <div className="relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={lab2Image} 
                  alt="Lab Facility 2" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">VLSI & Embedded Lab</h3>
                  <p className="text-sm text-gray-200">Cutting-edge VLSI design and embedded systems</p>
                </div>
              </div>
            </div>
            <div className="group">
              <div className="relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={lab3Image} 
                  alt="Lab Facility 3" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">Communication Systems Lab</h3>
                  <p className="text-sm text-gray-200">Modern communication and networking facilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ACHIEVEMENTS SECTION */}
      <motion.section 
        className="bg-gray-50 dark:bg-gray-900 py-16 px-2 sm:px-16"
        variants={floatVariant} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col items-center"> {/* Increased max width */}
          <h2 className="text-4xl font-extrabold text-red-700 mb-10 text-center">Department Achievements</h2>
          <div className="w-full flex justify-center">
            {/* Make AchievementsCarousel wider */}
            <div className="w-full max-w-[1100px]">
              <AchievementsCarousel />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Move Faculty Section here, just above the footer */}
      <FacultySection />

      {/* FOOTER */}
      <footer className="bg-red-700 text-white py-8 md:py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Quick Links Section */}
          <div className="mb-8">
            <h3 className="font-bold text-xl text-white mb-6 text-center">Quick Links</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <svg className="w-8 h-8 text-white mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <h4 className="font-semibold text-white mb-2">Contact HOD</h4>
                  <a href="mailto:hodece@rguktrkv.ac.in" className="text-white/80 hover:text-white text-sm break-all">
                    hodece@rguktrkv.ac.in
                  </a>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <svg className="w-8 h-8 text-white mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-white mb-2">Department</h4>
                  <a href="#" className="text-white/80 hover:text-white text-sm">ECE Department</a>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <svg className="w-8 h-8 text-white mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <h4 className="font-semibold text-white mb-2">LinkedIn</h4>
                  <a href="https://www.linkedin.com/company/academic-affairs-club-aac-rgukt-rkvalley/" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm">Academic Affairs Club</a>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <svg className="w-8 h-8 text-white mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-white mb-2">Student Portal</h4>
                  <a href="/login" className="text-white/80 hover:text-white text-sm">Student Login</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright Section */}
          <div className="border-t border-white/20 pt-6">
            {/* Department Info and Links Row */}
            <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
              {/* Left Column - Department Info */}
              <div className="mb-6 lg:mb-0">
                <h3 className="font-bold text-lg mb-2">
              Department of Electronics and Communication Engineering
            </h3>
                <p className="text-sm mb-3">
              Rajiv Gandhi University of Knowledge Technologies - RK Valley
            </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Address:</span>
                    <span className="text-white/90">RK Valley, Vempalli, Kadapa, 516330</span>
          </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-white/80">Email:</span>
                    <span className="text-white/90">hodece@rguktrkv.ac.in</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
  {/* FontAwesome Location Icon */}
  <FontAwesomeIcon icon={faLocationDot} className="text-red-500 w-5 h-5" />

  {/* Google Maps Link */}
  <a 
    href="https://maps.google.com/?q=RK+Valley,+Vempalli,+Kadapa,+516330" 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-white/90 hover:text-white transition-colors"
  >
    View on Google Maps
  </a>
</div>
                </div>
              </div>
              
              {/* Right Column - Other Links */}
              <div className="lg:text-right">
                <h4 className="font-semibold text-white mb-3">OTHER LINKS</h4>
                <div className="space-y-2 text-sm">
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Institute ERP</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Institute Email</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Academic Portal</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Student Portal</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Faculty Directory</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Privacy Policy</a></div>
                  <div><a href="#" className="text-white/80 hover:text-white transition-colors">Contact Us</a></div>
                </div>
              </div>
            </div>
            
            {/* Copyright Row */}
            <div className="text-center text-sm text-white/80">
              <p>© {new Date().getFullYear()} Department of Electronics and Communication Engineering, RGUKT RK Valley. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
