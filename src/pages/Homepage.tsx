// src/pages/LandingPage.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Logo from "../Assets/rgukt.jpeg";
import aboutImage from "../Assets/hero3.jpeg";
import achievementsImage from "../Assets/hero1.jpg";
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
import mohammodrafi from "../Assets/faculty/shaik_mohammod_rafi.jpg";
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

// NEW: Import the modal components and define the faculty type
import FacultyDetailsModal from "../components/FacultyDetailsModal";
import CreatorsPage from "../components/CreatorsPage";

interface Announcement {
  author: string;
  time: string;
  title: string;
  content: string;
  targetRole: string;
}

// Define the type for the faculty object with added details
interface Faculty {
  name: string;
  title: string;
  image: string;
  email?: string;
  department?: string;
  bio?: string;
  education?: string;
  experience?: string;
  researchAreas?: string[];
  publications?: string[];
  coursesTaught?: string[];
  administrativeRoles?: string[];
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

  // State for the faculty details floating window
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showModal, setShowModal] = useState(false);

  // NEW state for the Creators page floating window
  const [isCreatorsPageOpen, setIsCreatorsPageOpen] = useState(false);

  // NEW: Ref for the Faculty section to enable scrolling to it
  const facultySectionRef = useRef<HTMLElement>(null);

  const scrollToFaculty = () => {
    facultySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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


  // NEW: handler to manage the modal
  const handleFacultyClick = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFaculty(null);
  };

  // UPDATED: Added more details to the faculty list for the modal
  const facultyList: Faculty[] = [
    {
      name: "Mr. Y Arun Kumar Reddy",
      title: "Head of the Department",
      image: arunKumarReddy,
      email: "y.arunkumarreddy@rguktrkv.ac.in",
      bio: "Mr. Y Arun Kumar Reddy serves as the Head of the Department. He has extensive academic experience and has held several key administrative roles within the department.",
      education: "M. Tech. (2009-2011) in Telecommunication Systems Engineering from IIT Kharagpur; B. Tech. (2004-2008) in ECE from VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad.",
      experience: "Assistant Professor at RGUKT, RK Valley since 2011.",
      researchAreas: ["Wireless communication"],
      coursesTaught: [
        "Electrical Technology", "Analog Communications", "Digital Communications", "Wireless Communications", "Information Theory and Coding", "Probability and Stochastic process", "Electromagnetic Theory and Transmission Lines", "Electronic Devices and Circuits"
      ],
      administrativeRoles: ["Branch Coordinator (2013-14, 2016-17)"]
    },
    {
      name: "Mr. B. V. Sudhakar Reddy",
      title: "Assistant Professor",
      image: sudhakarReddy,
      email: "sudhakar@rguktrkv.ac.in",
      bio: "Mr. B. V. Sudhakar Reddy is an Assistant Professor with a strong background in telecommunications and signal processing. He has significant administrative experience within the university.",
      education: "M. Tech. (2010) in Telecommunication Systems Engineering from IIT Kharagpur; AMIETE (2008) in E&T Engineering from IETE.",
      experience: "Assistant Professor at RGUKT, RK Valley (2010-2016), RGUKT Nuzvid (2016), and currently at RGUKT, RK Valley (since 2016).",
      researchAreas: ["MIMO", "Cognitive Radio", "Software Defined Radio"],
      coursesTaught: [
        "Wireless Communications", "Digital Communications", "Analog Communications", "Analog Electronic Circuits", "Basic Electronics", "Network Theory", "Electrical Technology"
      ],
      administrativeRoles: ["Mess In-charge", "Controller of Examinations In-charge (2014-16)", "Student Welfare Officer (2011-13)"]
    },
    {
      name: "Ms. G. Lakshmi Shireesha",
      title: "Assistant Professor",
      image: lakshmiShirisha,
      email: "glakshmishireesha@rguktrkv.ac.in",
      bio: "Ms. G. Lakshmi Shireesha is an Assistant Professor with expertise in wireless technologies. She has held prominent administrative roles, including serving as the Head of the Department.",
      education: "M.Tech from NIT-Trichy.",
      experience: "Working at RGUKT, RK Valley since 2014.",
      researchAreas: ["Cooperative Communications", "5G and 6G Wireless Technologies"],
      coursesTaught: [
        "Analog Communications", "Basic Electronics", "Digital Communications", "Signals and Systems", "Digital Signal Processing", "Communication Systems-1 & 2", "Mobile Communication", "Wireless Communication"
      ],
      administrativeRoles: ["Head of the Department (2020-2021)", "Department Placement Coordinator", "Assistant Student Welfare Officer"]
    },
    {
      name: "Mr. Janardhan. Reddy",
      title: "Assistant Professor",
      image: janardhanReddy,
      email: "janardhanreddy@rguktrkv.ac.in",
      bio: "Mr. Janardhan Reddy is an Assistant Professor with a background in advanced circuit design and antennas. He has held administrative positions as a Head of the Department at multiple campuses.",
      education: "M.Tech and Ph.D.",
      experience: "Working at RGUKT since 2016.",
      researchAreas: ["EMI/EMC", "Microstrip Antennas"],
      coursesTaught: [
        "Network Theory", "Basic Electrical and Electronics Engineering", "Basic Electronics", "Digital Image Processing", "Digital Logic Design", "Principles of Radar", "Electro Magnetic Engineering", "Radio Frequency and Microwave Engineering", "Antenna Radio Wave Propagation", "Electronic Devices and Circuits"
      ],
      administrativeRoles: ["Skill Development Center Coordinator (2022-present)", "Head of the Department (2019-2022)"]
    },
    {
      name: "Mrs. V Lakshmi Prasanna",
      title: "Assistant Professor",
      image: lakshmiPrasanna,
      email: "vella.prasu@rguktrkv.ac.in",
      bio: "Mrs. V Lakshmi Prasanna is an Assistant Professor specializing in VLSI and embedded systems. She is currently serving in a key administrative role within the university's examination section.",
      education: "M.Tech (2015) in VLSI from JNTU Anantapur; B.Tech (2011) in ECE from JNTU Anantapur.",
      experience: "Assistant Professor at RGUKT-RK Valley since 2021; Assistant Professor & HOD at Sai Rajeswari Institute of Technology (2015-2021).",
      researchAreas: ["VLSI (System Design, Testing & Testability)", "Embedded Systems", "Microprocessors & Microcontrollers"],
      coursesTaught: [
        "Embedded Systems", "Computer Networks", "Microprocessors and Microcontrollers", "Digital Logic Design", "Computer Organisation & Architecture", "Electronic Devices & Circuits", "Probability Theory & Stochastic Processes", "Linear Integrated Circuits"
      ],
      administrativeRoles: ["Associate Controller of Examination (ACOE) (2024-present)"]
    },
    {
      name: "Mr. P. Siva Krishna",
      title: "Assistant Professor",
      image: shivaKrishna,
      email: "psivakrishna@rguktrkv.ac.in",
      bio: "Mr. P. Siva Krishna is an Assistant Professor with a focus on control systems, biomedical applications, and embedded systems. He has contributed to various publications and teaches a wide range of subjects.",
      education: "M.Tech from a college affiliated to ANU (2009); B.Tech (2006).",
      experience: "Over 13 years of teaching experience, including at RVR&JC College of engineering.",
      researchAreas: ["Control Systems", "Biomedical", "Embedded"],
      coursesTaught: [
        "EDC", "AEC", "MEMS", "SC", "CONTROL SYSTEMS", "SS"
      ],
      administrativeRoles: []
    },
    {
      name: "Mr. K. Abdul Munaf",
      title: "Assistant Professor",
      image: abdulMunaf,
      email: "kabdulmunaf@rguktrkv.ac.in",
      bio: "Mr. K. Abdul Munaf is an Assistant Professor with a specialization in VLSI System Design. He is currently pursuing a Ph.D. and has several publications and workshop experiences to his credit.",
      education: "M.Tech in VLSI SYSTEM DESIGN (2011) from JNTU Ananthapur; B.Tech (2008) from JNTU Hyderabad. Currently pursuing Ph.D. from SV University.",
      experience: "Assistant Professor at RGUKT since 2018; previously worked at Ravindra College of Engineering for Women (2011-2018).",
      researchAreas: ["ANALOG & DIGITAL ELECTRONICS", "VLSI", "MICROELECTRONICS"],
      coursesTaught: [
        "MICROCONTROLLERS & APPLICATIONS", "EMBEDDED SYSTEMS", "EMBEDDED REAL TIME SYSTEMS", "MICROPROCESSORS & MICROCONTROLLERS", "DIGITAL IC APPLICATIONS", "LINEAR & DIGITAL IC APPLICATIONS", "ELECTRONIC DEVICES & CIRCUITS", "ELECTONIC CIRCUIT ANALYSIS", "ANALOG ELECTONIC CIRCUITS", "SWITCHING THEORY & LOGIC DESIGN", "ELECTONIC CIRCUIT ANALYSIS & DESIGN", "MICRO ELECTRONIC & MECHANICAL SYSTEMS", "BASIC ELECTRICAL & ELECTRONICS ENGINEERING", "LOW POWER VLSI CIRCUITS & SYSTEMS", "DIGITAL LOGIC DESIGN"
      ],
      administrativeRoles: []
    },
    {
      name: "Mrs. M. Anitha",
      title: "Assistant Professor",
      image: mAnitha,
      email: "manitha@rguktrkv.ac.in",
      bio: "Mrs. M. Anitha is an Assistant Professor with an M.Tech and is pursuing a Ph.D. She has diverse experience at RGUKT-RKV, serving as an Academic Consultant and Guest Faculty before her current role.",
      education: "M.Tech and pursuing Ph.D.",
      experience: "Assistant Professor at RGUKT since 2018; previously Guest Faculty and Academic Assistant.",
      researchAreas: [],
      coursesTaught: [
        "Computer Networks", "Switching Theory and Logic Design", "Control System", "Hardware Description Language", "VLSI System Design", "Basic Electrical and Electronics Engineering", "Basic Electronics", "Digital Image Processing", "Digital Logic Design", "Electronic Devices and Circuits"
      ],
      administrativeRoles: []
    },
    {
      name: "Mr. B Madhan Mohan",
      title: "Head of the Department",
      image: madhanMohan,
      email: "madhan.betharaju@rguktrkv.ac.in",
      bio: "Mr. B Madhan Mohan is the Head of the Department and also the IQAC Associate Coordinator. He is a member of professional bodies like SDIWC and IAENG. His research interests are in Image Processing and Communication Systems.",
      education: "M.Tech.",
      experience: "Working at RGUKT, RK Valley since 2021.",
      researchAreas: ["Image Processing", "Communication Systems"],
      coursesTaught: [
        "Analog Communications", "Digital Communications", "Mobile Communications", "Digital Electronics", "Digital System Design", "Digital Image Processing"
      ],
      administrativeRoles: ["Head of the Department (since 2022)", "IQAC Associate Coordinator (since 2023)"]
    },
    {
      name: "Mr. N Mohan Raju",
      title: "Head of the Department",
      image: mohanRaju,
      email: "nmohanraju@rguktrkv.ac.in",
      bio: "Mr. N Mohan Raju is the Head of the Department at RGUKT-RK Valley since November 2023. He holds an M.Tech and has served as an Associate Controller of Examinations. His research interests include VLSI, Embedded Systems, and IoT.",
      education: "M.Tech.",
      experience: "Working at RGUKT, RK Valley since 2018.",
      researchAreas: ["VLSI", "Embedded systems", "IOT"],
      coursesTaught: [
        "Digital system design", "digital logic design", "VLSI", "Embedded systems", "Microprocessors and microcontrollers", "optical communications", "signals and systems", "Digital signal processing", "Digital IC applications"
      ],
      administrativeRoles: ["Head of the Department (2023-present)", "Associate Controller of Examinations (2021-22)", "NSS Program officer (2015-17)"]
    },
    {
      name: "Mr. R. Pavan kumar",
      title: "Assistant Professor",
      image: pavanKumar,
      email: "rpavankumar@rguktrkv.ac.in",
      bio: "Mr. R. Pavan Kumar is an Assistant Professor with 10 years of teaching experience. His M.Tech is from JNTUCEP. His research areas of interest are Biomedical Signal Processing, Analog & Digital Electronics.",
      education: "M.Tech from JNTUCEP.",
      experience: "10 years of teaching experience at RGUKT RK Valley.",
      researchAreas: ["Bio medical signal processing", "Analog & Digital Electronics"],
      coursesTaught: [
        "Electronic devises and circuits", "Analog electronics and circuits", "signals and systems", "BEEE", "Satellite communication", "Electronics Measurements and instrumentation", "Digital electronics"
      ],
      administrativeRoles: []
    },
    {
      name: "Mr. SAFARI BHASKAR RAO",
      title: "Assistant Professor",
      image: safariBhaskarRao,
      email: "safaribhaskar@rguktrkv.ac.in",
      bio: "Mr. Safari Bhaskar Rao is an Assistant Professor with an M.Tech. He has publications in various journals and has attended several FDPs on topics like VLSI design and 'Outcome Based Education'.",
      education: "M.Tech.",
      experience: "No detailed experience provided in the source data.",
      researchAreas: [],
      coursesTaught: [
        "Electronic Devices and Circuits", "ANALOG AND DIGITAL COMMUNICATION", "Analog Electronics Circuits", "Signal and System"
      ],
      administrativeRoles: []
    },
    {
      name: "Mrs. SHAIK RIAZUM",
      title: "Assistant Professor",
      image: shaikRiyazum,
      email: "riazunshaik@rguktrkv.ac.in",
      bio: "Mrs. Shaik Riazum is an Assistant Professor who joined RGUKT-RKV in Feb 2024. Her research interests are Embedded Systems, Analog & Digital Electronics. She has a publication on 'Microcontroller managed module for Automatic Ventilation of Vehicle Interior'.",
      education: "M.Tech.",
      experience: "4 years in another college (2016-2019) and at RGUKT-RKV since 2024.",
      researchAreas: ["Embedded Systems", "Analog & Digital Electronics"],
      coursesTaught: [
        "Digital Logic Design", "Switching Theory & Logic Design"
      ],
      administrativeRoles: []
    },
    {
      name: "Mr. K. Harinath Reddy",
      title: "Assistant Professor",
      image: krishnamHarinathReddy,
      email: "harinathreddy108@rguktrkv.ac.in",
      bio: "Mr. K. Harinath Reddy is an Assistant Professor with an M.Tech. He has multiple publications and has attended various FDPs, including one on VLSI Design. He is also a member of the Institute for Engineering Research and Publication.",
      education: "M.Tech.",
      experience: [],
      researchAreas: [],
      coursesTaught: [
        "Electronic Devices and Circuits", "Digital signal desigen", "Analog electronic circuits", "Microprocessor and controller", "Embedded systems"
      ],
      administrativeRoles: []
    },
    {
      name: "Mr. Venkatesulu",
      title: "Assistant Professor",
      image: venkatesulu,
      email: "v.sugali7@rguktrkv.ac.in",
      bio: "Mr. S. Venkatesulu is an Assistant Professor with a Ph.D. in ECE (2015) and an M.Tech in Embedded Systems (2008). He has extensive academic and industrial experience, including prior roles as Professor and HOD. He has published a book and numerous international journal papers.",
      education: "Ph.D. (2015) from JNTU, Ananthapur; M.Tech (2008) in Embedded Systems from AITS, JNTU HYD; B.Tech (2004) from MITS, JNTU HYD.",
      experience: "Assistant Professor at RGUKT since 2024; Professor and HOD at AVNIET (2015-2018); other roles as Embedded System Engineer and PCB Design Engineer.",
      researchAreas: [],
      coursesTaught: [
        "Signal Processing", "Computer Networks", "Cellular & Mobile Communication", "Principles of Communications", "Digital Logic Design", "Embedded system", "Microprocessor and Interfacing", "Microprocessor and Micro Controller", "Linear Integrated Digital Circuits", "Digital Data communication", "Pulse and Digital Circuits", "Electronics and Devices circuits", "Optical Communication System", "ARM Architecture"
      ],
      administrativeRoles: ["NAAC Coordinator", "IQAC Director", "NBA work Tier-1 and Tier-2"]
    }
  ];
  // MODIFIED: FacultySection now takes a prop `onFacultyClick`
  const FacultySection: React.FC<{ onFacultyClick: (faculty: Faculty) => void }> = ({ onFacultyClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
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

    useEffect(() => {
      const handleScroll = () => {
        if (scrollRef.current) {
          if (scrollRef.current.scrollLeft + scrollRef.current.clientWidth >= scrollRef.current.scrollWidth - 10) {
            setScrollDirection("left");
          }
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

    const startAutoScroll = (direction: "left" | "right") => {
      stopAutoScroll();
      scrollInterval.current = setInterval(() => scroll(direction), 100);
    };

    const stopAutoScroll = () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
    };

    return (
      <motion.section
        ref={facultySectionRef} // ADDED: Ref to this section
        className="bg-gray-50 py-8 px-2 sm:px-8 dark:bg-gray-900"
        variants={floatVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-700 mb-6">
          Faculty
        </h2>
        <div className="relative max-w-7xl mx-auto">
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
                // MODIFIED: Added onClick handler and cursor styles
                onClick={() => onFacultyClick(fac)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 text-center min-w-[160px] sm:min-w-[220px] cursor-pointer hover:scale-105 transition-transform duration-200`}
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
                </h3>
                <p className="text-gray-600 text-sm sm:text-base dark:text-gray-400">
                  {fac.title}
                </p>
              </div>
            ))}
          </div>
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
    )
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const AchievementsCarousel: React.FC = () => {
    const [currentAchievement, setCurrentAchievement] = useState(0);
    const achievementsIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      achievementsIntervalRef.current = setInterval(() => {
        setCurrentAchievement((prev) => (prev + 1) % achievementsData.length);
      }, 4000);

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
              className={`w-3 h-3 rounded-full transition-colors ${idx === currentAchievement ? "bg-red-700" : "bg-gray-400"
                }`}
              onClick={() => setCurrentAchievement(idx)}
              aria-label={`Show achievement ${idx + 1}`}
            />
          ))}
        </div>
        <div className="absolute top-2 right-2 animate-pulse">
          <svg width="244" height="24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#FBBF24" opacity="0.7" />
            <circle cx="18" cy="6" r="1.5" fill="#F87171" opacity="0.7" />
            <circle cx="6" cy="18" r="1" fill="#60A5FA" opacity="0.7" />
          </svg>
        </div>
      </div>
    );
  };

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
        <div className="pr-2 sm:pr-6 mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-4">
          <ThemeToggle />
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

      {/* Floating vertical strip button for Creators Page */}
      <button
        onClick={() => setIsCreatorsPageOpen(true)}
        // NEW: Positioned to be flush with the screen's right edge
        className="fixed top-1/2 right-0 -translate-y-1/2 transform rotate-90 origin-bottom-left translate-x-12 z-40 bg-red-700 text-white px-4 py-2 rounded-t-lg shadow-lg hover:bg-red-800 transition-colors md:block"
        aria-label="Go to Creators page"
      >
        <span className="flex items-center space-x-2 whitespace-nowrap">
          <span className="text-sm font-bold">Developers</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </span>
      </button>

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
          onClick={prevSlide}
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
          onClick={nextSlide}
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
                pauseThenResume(1000);
              }}
              className={`w-4 h-4 rounded-full transition-transform focus:outline-none ${idx === current
                ? "bg-white scale-110"
                : "bg-white/50 hover:bg-white/80"
                }`}
            />
          ))}
        </div>

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
              <h2 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md select-none">
                {" "}
                {cap.title}{" "}
              </h2>
              <p className="mt-3 max-w-2xl text-sm sm:text-lg text-white/95 select-none">
                {" "}
                {cap.subtitle}{" "}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <motion.main
        className="flex-grow w-full flex flex-col items-start px-2 sm:px-4 py-4 md:px-16 lg:px-20 xl:px-24"
        variants={floatVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="w-full max-w-7xl">
          <div className="md:flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 xl:gap-16 items-start">
            <div className="flex-1 min-w-0">
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
                    className="flex-1 bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-md p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 transition hover:shadow-lg text-left"
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
        <div className="max-w-[1400px] mx-auto flex flex-col items-center">
          <h2 className="text-4xl font-extrabold text-red-700 mb-10 text-center">Department Achievements</h2>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1100px]">
              <AchievementsCarousel />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Move Faculty Section here, just above the footer */}
      <FacultySection onFacultyClick={handleFacultyClick} />

      {/* NEW: Conditional rendering of the modal */}
      {showModal && selectedFaculty && (
        <FacultyDetailsModal
          faculty={selectedFaculty}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal for Creators Page */}
      <CreatorsPage
        isOpen={isCreatorsPageOpen}
        onClose={() => setIsCreatorsPageOpen(false)}
      />

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
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
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

          {/* Copyright Row */}
          <div className="border-t border-white/20 pt-6">
            {/* Department Info, Map, and Links Row */}
            <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-8">
              {/* Left Column - Department Info */}
              <div className="flex-1 min-w-0">
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
                </div>
              </div>

              {/* Center Column - Google Map Preview */}
              <div className="flex-1 min-w-0 w-full lg:w-auto">
                <h4 className="font-semibold text-white mb-3">LOCATION</h4>
                <div className="w-full h-48 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.602741995817!2d78.5373097!3d14.3353797!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb3a24eacd4a67d%3A0x88cc62e6279e1ef0!2sIIIT%20RGUKT%20RK%20VALLEY!5e0!3m2!1sen!2sin!4v1693617600000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="RGUKT RK Valley Location"
                  ></iframe>
                </div>
              </div>

              {/* Right Column - Other Links */}
              <div className="flex-1 min-w-0 lg:text-right">
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
