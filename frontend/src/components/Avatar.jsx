import React from 'react';
import { motion } from 'framer-motion';

/**
 * Avatar Component - Display user avatars with fallback to initials
 * @param {string} src - Image URL
 * @param {string} name - User's name (used for fallback initials)
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {boolean} animate - Whether to animate on hover
 * @param {string} className - Additional CSS classes
 */
export default function Avatar({ 
  src, 
  name = "User", 
  size = "md", 
  animate = true,
  className = "" 
}) {
  const sizeClasses = {
    xs: "w-8 h-8 text-xs",
    sm: "w-12 h-12 text-sm",
    md: "w-16 h-16 text-base",
    lg: "w-24 h-24 text-xl",
    xl: "w-32 h-32 text-2xl"
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColorFromName = (name) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const [imageError, setImageError] = React.useState(false);
  const showImage = src && !imageError;

  const avatarContent = showImage ? (
    <img
      src={src}
      alt={name}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  ) : (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold ${getColorFromName(name)}`}>
      {getInitials(name)}
    </div>
  );

  const AvatarComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {};

  return (
    <AvatarComponent
      className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-md border-2 border-white ${className}`}
      {...animationProps}
    >
      {avatarContent}
    </AvatarComponent>
  );
}
