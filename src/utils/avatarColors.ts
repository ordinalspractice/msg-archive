// Utility function to generate consistent colors for participants
export const getAvatarColor = (name: string): string => {
  const colors = [
    'red.500',
    'orange.500', 
    'yellow.500',
    'green.500',
    'teal.500',
    'blue.500',
    'cyan.500',
    'purple.500',
    'pink.500',
    'indigo.500',
    'red.600',
    'orange.600',
    'yellow.600',
    'green.600',
    'teal.600',
    'blue.600',
    'cyan.600',
    'purple.600',
    'pink.600',
    'indigo.600',
  ];

  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};