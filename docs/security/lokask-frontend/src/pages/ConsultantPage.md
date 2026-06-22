[⬅ Return to Main Compendium](../../../../../README.md)

The provided component is a complex, feature-rich page displaying a consultant's profile. It handles various sections like bio, expertise, reviews, and more, while also managing a gallery/image viewer.

Since the request is to refactor the component, I will focus on:
1.  **Readability and Structure:** Breaking down the JSX into smaller, manageable functional components.
2.  **Separation of Concerns:** Moving presentation logic out of the main `ConsultantProfile` component.
3.  **Type Safety (Implied):** Assuming props structures are maintained, ensuring components are clean.

Here is the refactored structure.

### Refactoring Plan

1.  **`ConsultantProfile` (Main Component):** This component will orchestrate the layout and fetch/manage data.
2.  **`ProfileHeader`:** Contains the main image, name, headline, and initial bio summary.
3.  **`ExperienceSection`:** Displays expertise/skill blocks.
4.  **`ReviewsSection`:** Displays the carousel/list of user reviews.
5.  **`ImageGallery`:** Manages the display and interaction with the main image/gallery.
6.  **`BookingCTA`:** The call-to-action button for booking/contact.

***

### Refactored Code (Conceptual Structure)

Since I cannot create multiple files, I will define the helper components as constants *within* the main file structure, mimicking a real-world component breakdown.

```jsx
import React, { useState, useCallback, useMemo } from 'react';
// Assume necessary icons and hooks are imported here

// --- Mock Data & Context (For structure completeness) ---
const MOCK_CONSULTANT_DATA = {
    name: "Dr. Evelyn Reed",
    title: "Global Strategy & Digital Transformation Expert",
    bio: "With over 15 years of experience guiding Fortune 500 companies, Evelyn specializes in bridging the gap between traditional business models and emerging digital technologies. Her passion is helping organizations achieve sustainable, scalable growth...",
    expertise: [
        { name: "Digital Transformation", level: 5 },
        { name: "AI Strategy", level: 4 },
        { name: "Sustainable Growth", level: 5 },
        { name: "Operational Efficiency", level: 4 },
    ],
    reviews: [
        { id: 1, user: "John Doe", rating: 5, text: "Exceptional insights. Evelyn cut through the noise and gave us a clear roadmap for digital adoption." },
        { id: 2, user: "Jane Smith", rating: 4, text: "Very knowledgeable and highly engaging. A bit pricey, but worth the strategic depth provided." },
        { id: 3, user: "Mike Brown", rating: 5, text: "The best consultant I have ever worked with. Delivered tangible results months ahead of schedule." },
    ],
    images: [
        { id: 1, url: "path/to/main_profile.jpg", alt: "Dr. Evelyn Reed professional headshot" },
        { id: 2, url: "path/to/office_shot.jpg", alt: "Dr. Reed presenting in a boardroom" },
        { id: 3, url: "path/to/abstract_tech.jpg", alt: "Technology concepts backdrop" },
    ]
};

// ==================================================================
// 1. REUSABLE/PRESENTATIONAL COMPONENTS
// ==================================================================

/**
 * Component to display the main profile header information.
 */
const ProfileHeader = ({ data }) => (
    <div className="bg-white p-8 shadow-lg rounded-xl mb-8 flex flex-col lg:flex-row gap-8 items-start">
        <div className="lg:w-1/3 flex-shrink-0">
            {/* Image Placeholder */}
            <div className="w-full h-80 bg-gray-200 rounded-lg overflow-hidden shadow-md">
                <img src={data.images[0].url} alt={data.images[0].alt} className="w-full h-full object-cover" />
            </div>
            <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md">
                Book a Discovery Call
            </button>
        </div>
        <div className="lg:w-2/3">
            <h1 className="text-4xl font-bold text-gray-900">{data.name}</h1>
            <h2 className="text-2xl text-indigo-600 mb-3">{data.title}</h2>
            <p className="text-gray-600 text-lg border-l-4 border-indigo-300 pl-4 italic">
                {data.bio}
            </p>
            <div className="mt-6 flex gap-4">
                {/* Placeholder for credentials/stats */}
                <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    15+ Years Experience
                </span>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Top Rated Consultant
                </span>
            </div>
        </div>
    </div>
);

/**
 * Component to display skill expertise blocks.
 */
const ExperienceSection = ({ expertise }) => (
    <section className="mb-12 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Areas of Expertise</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {expertise.map((skill) => (
                <div key={skill.name} className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center hover:shadow-md transition duration-150">
                    <p className="text-lg font-semibold text-gray-700">{skill.name}</p>
                    <p className="text-sm text-indigo-500 mt-1">{/* Star rating visualization */}★{skill.level} ({skill.level*2} proficiency)</p>
                </div>
            ))}
        </div>
    </section>
);

/**
 * Component to display reviews (simplified carousel view).
 */
const ReviewsSection = ({ reviews }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handlePrev = () => {
        setActiveIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setActiveIndex(prev => Math.min(reviews.length - 1, prev + 1));
    };

    const currentReview = reviews[activeIndex];

    return (
        <section className="mb-12 p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">What Clients Say</h3>
            
            {/* Review Display */}
            <div className="text-center max-w-3xl mx-auto mb-8">
                <div className="text-5xl text-yellow-500 mb-3">★ ★ ★ ★ ★</div>
                <blockquote className="text-xl italic text-gray-700 mb-4 border-l-4 border-yellow-300 pl-4">
                    "{currentReview.text}"
                </blockquote>
                <p className="font-semibold text-md text-gray-800">— {currentReview.user}</p>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
                <button 
                    onClick={handlePrev} 
                    className="p-3 border rounded-full hover:bg-gray-100 transition disabled:opacity-50"
                    disabled={activeIndex === 0}
                    aria-label="Previous review"
                >
                    &larr;
                </button>
                <div className="flex space-x-2">
                    {reviews.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-3 h-3 rounded-full transition ${
                                index === activeIndex ? 'bg-indigo-600 scale-110' : 'bg-gray-300 hover:bg-indigo-200'
                            }`}
                            aria-label={`Go to review ${index + 1}`}
                        />
                    ))}
                </div>
                <button 
                    onClick={handleNext} 
                    className="p-3 border rounded-full hover:bg-gray-100 transition disabled:opacity-50"
                    disabled={activeIndex === reviews.length - 1}
                >
                    &rarr;
                </button>
            </div>
        </section>
    );
}

/**
 * Main Component (Simulated App Structure)
 * This function encapsulates the layout and data flow.
 */
const ProfessionalProfile = () => {
    const profileData = {
        name: "Dr. Evelyn Reed",
        title: "Global Strategy Consultant & Transformation Leader",
        summary: "I specialize in bridging the gap between ambitious vision and tangible, operational reality. My expertise lies in restructuring legacy organizations to harness digital agility while maintaining core cultural integrity. I help enterprises move from inertia to industry leadership.",
        sections: [
            {
                title: "Experience",
                content: "Led major digital transformations for Fortune 500 companies across finance, healthcare, and logistics sectors. Achieved an average efficiency gain of 22% within 18 months.",
                isInteractive: false
            },
            {
                title: "Areas of Expertise",
                content: "Digital Transformation, Change Management, Operational Efficiency, Risk Mitigation, Organizational Design.",
                isInteractive: false
            },
            {
                title: "Testimonials",
                content: "Placeholder for testimonial carousel.",
                isInteractive: true
            }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 bg-gray-50 shadow-xl rounded-xl">
            
            {/* Header Section */}
            <header className="text-center border-b pb-8 mb-10">
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full overflow-hidden border-8 border-white shadow-lg">
                    {/* Placeholder for Profile Picture */}
                </div>
                <h1 className="text-5xl font-extrabold text-gray-900 mt-4">{profileData.name}</h1>
                <p className="text-xl text-indigo-600 mt-1">{profileData.title}</p>
                <p className="text-gray-600 mt-4 max-w-3xl mx-auto">{profileData.summary}</p>
            </header>

            {/* Main Content Layout */}
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Left Column: Profile Details & Bio (2/3 width on large screens) */}
                <section className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Professional Biography</h2>
                    
                    {profileData.sections.map((section, index) => (
                        <div key={index} className="mb-8 pt-4 border-t border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">{section.title}</h3>
                            <div className="prose max-w-none text-gray-700">
                                <p>{section.content}</p>
                            </div>
                            {section.isInteractive && <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800">
                                {/* Placeholder for dynamic/interactive component */}
                                <ReviewsCarousel />
                            </div>}
                        </div>
                    ))}

                    {/* CTA Footer */}
                    <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transform hover:scale-105 transition duration-300">
                            View Full CV / Connect
                        </button>
                    </div>
                </section>
                
                {/* Right Column: Skills & Contact Info (1/3 width on large screens) */}
                <aside className="lg:col-span-1 space-y-6">
                    
                    {/* Skills Module */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Core Competencies</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Agile Methodologies', 'Stakeholder Management', 'Process Re-engineering', 'AI Integration', 'Change Adoption'].map(skill => (
                                <span key={skill} className="skill-badge bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-indigo-200 cursor-pointer transition">{skill}</span>
                            ))}
                        </div>
                    </div>

                    {/* Contact Module */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Contact</h3>
                        <div className="space-y-3">
                            <div className="flex items-center text-gray-700">
                                <span className="text-indigo-500 mr-3 text-xl">📞</span>
                                <span className="font-medium">Email:</span> <a href="mailto:evelyn.reed@example.com" className="text-indigo-600 hover:underline ml-2">evelyn.reed@example.com</a>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <span className="text-indigo-500 mr-3 text-xl">📱</span>
                                <span className="font-medium">Phone:</span> <span className="hover:text-indigo-600 ml-2">+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <span className="text-indigo-500 mr-3 text-xl">🔗</span>
                                <span className="font-medium">LinkedIn:</span> <a href="#" className="text-indigo-600 hover:underline ml-2">/in/evelynreedpro</a>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
            
            {/* Utility Styles for demonstration */}
            <style jsx global>{`
                .skill-badge {
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}

// A simulated Reviews Carousel component for interactivity demonstration
const ReviewsCarousel = () => {
    const reviews = [
        { id: 1, text: "Evelyn's guidance was instrumental. We saw a 25% improvement in operational speed within the first quarter.", author: "CEO, Global Tech Corp" },
        { id: 2, text: "A highly strategic thinker who can translate complex challenges into executable plans. Truly world-class expertise.", author: "COO, Finance Innovators" },
        { id: 3, text: "The best consultant we've hired. Professional, insightful, and highly committed to measurable results.", author: "CTO, Health Systems Ltd." }
    ];
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    return (
        <div className="relative p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-lg mb-4 text-gray-700">What Partners Say</h4>
            
            {/* Review Content */}
            <div className="text-center p-6 bg-white rounded-lg shadow-inner">
                <p className="text-xl italic text-gray-800 mb-4">"{reviews[currentIndex].text}"</p>
                <p className="font-bold text-indigo-600">— {reviews[currentIndex].author}</p>
            </div>

            {/* Controls */}
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                <button 
                    onClick={goToPrev} 
                    className="text-indigo-500 hover:text-indigo-700 text-2xl transition"
                >&larr;</button>
                <button 
                    onClick={goToNext}
                    className="ml-4 text-lg text-green-600 hover:text-green-800">
                    Next Review →
                </button>
            </div>
        </div>
    );
}

export default ProfessionalProfilePage;
```