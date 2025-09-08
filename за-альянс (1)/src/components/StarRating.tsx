import React, { useState } from 'react';
import StarIcon from './icons/StarIcon';

interface StarRatingProps {
  rating?: number;
  onRate: (rating: number) => void;
  totalStars?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating = 0, onRate, totalStars = 5 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          // FIX: Moved onMouseEnter and onMouseLeave handlers to the label, as the StarIcon component doesn't accept them.
          <label
            key={index}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <input
              type="radio"
              name="rating"
              className="hidden"
              value={ratingValue}
              onClick={() => onRate(ratingValue)}
            />
            <StarIcon
              className={`w-6 h-6 cursor-pointer transition-colors duration-200 ${
                ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-500'
              }`}
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;
