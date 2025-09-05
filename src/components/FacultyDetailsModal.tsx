import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// The Faculty interface is defined in your LandingPage.tsx,
// so let's replicate that structure here for type safety.
// It's best practice to export/import it from a shared file if possible.
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
    coursesTaught?: string[]; // Add this new property
    administrativeRoles?: string[];
}

// Update the props interface to match the Faculty type
interface FacultyDetailsModalProps {
    faculty: Faculty | null;
    onClose: () => void;
}

const dropIn = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: {
        y: "0",
        opacity: 1,
        transition: {
            duration: 0.1,
            type: "spring",
            damping: 25,
            stiffness: 500,
        },
    },
    exit: { y: "100vh", opacity: 0 },
};

const FacultyDetailsModal: React.FC<FacultyDetailsModalProps> = ({ faculty, onClose }) => {
    if (!faculty) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 relative"
                    variants={dropIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                        <img
                            src={faculty.image}
                            alt={faculty.name}
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-md"
                        />
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-yellow-300">
                                {faculty.name}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{faculty.title}</p>
                            {faculty.email && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Email:</span> {faculty.email}
                                </p>
                            )}
                            {faculty.department && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Department:</span> {faculty.department}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* All sections within this container are now left-aligned and well-spaced */}
                    <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 text-left">
                        {faculty.bio && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">About:</h4>
                                <p>{faculty.bio}</p>
                            </>
                        )}
                        {faculty.education && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Education:</h4>
                                <p>{faculty.education}</p>
                            </>
                        )}
                        {faculty.experience && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Experience:</h4>
                                <p>{faculty.experience}</p>
                            </>
                        )}
                        {faculty.researchAreas && faculty.researchAreas.length > 0 && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Research Interests:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {faculty.researchAreas.map((area, index) => (
                                        <li key={index}>{area}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {faculty.coursesTaught && faculty.coursesTaught.length > 0 && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Courses Taught:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {faculty.coursesTaught.map((course, index) => (
                                        <li key={index}>{course}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {faculty.publications && faculty.publications.length > 0 && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Key Publications:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {faculty.publications.map((pub, index) => (
                                        <li key={index}>{pub}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {faculty.administrativeRoles && faculty.administrativeRoles.length > 0 && (
                            <>
                                <h4 className="mt-4 font-bold text-red-700 dark:text-yellow-300">Administrative Roles:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {faculty.administrativeRoles.map((role, index) => (
                                        <li key={index}>{role}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FacultyDetailsModal;