import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        width="36" 
        height="36" 
        viewBox="0 0 36 36" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M18 33C26.2843 33 33 26.2843 33 18C33 9.71573 26.2843 3 18 3C9.71573 3 3 9.71573 3 18C3 26.2843 9.71573 33 18 33Z" fill="url(#paint0_linear_1_2)"/>
        <path d="M10.5 24.75V11.25L18 20.25L25.5 11.25V24.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="3" y1="18" x2="33" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5964f2"/>
                <stop offset="1" stopColor="#833ab4"/>
            </linearGradient>
        </defs>
    </svg>
);

export default Logo;