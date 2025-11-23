import React from 'react';

const Logo = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
    >
      <circle cx="256" cy="256" r="250" fill="#8B0000" stroke="#FFD700" strokeWidth="10" />

      <rect x="156" y="150" width="67" height="200" fill="#002395" />
      <rect x="223" y="150" width="66" height="200" fill="#FFFFFF" />
      <rect x="289" y="150" width="67" height="200" fill="#ED2939" />
    </svg>
  );
};

export default Logo;