import React from 'react';
import AvatarGen from 'boring-avatars';

interface AvatarProps {
  name: string;
  size: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, size }) => {
  return (
    <AvatarGen
      size={size}
      name={name}
      variant="beam"
      colors={['#5964f2', '#ff4b4b', '#e8e8e8', '#1a1b1e', '#111214']}
    />
  );
};

export default Avatar;
