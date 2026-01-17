import { useState } from 'react';

const RatingComponent = ({ docId, initialRating = 0, averageRating = 0, onRate, readOnly = false }) => {
    const [hover, setHover] = useState(0);
    const [rating, setRating] = useState(initialRating);

    // If the user hasn't rated, show the average. If they hover, show hover.
    // If they rated, show their rating.
    const displayRating = hover || rating || Math.round(averageRating);

    const handleClick = (value) => {
        if (readOnly) return;
        setRating(value);
        if (onRate) onRate(value);
    };

    return (
        <div className="rating-container">
            <div className="rating-stars">
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <span
                            key={index}
                            className={`star ${ratingValue <= displayRating ? 'filled' : ''} ${readOnly ? 'readonly' : ''}`}
                            onClick={() => handleClick(ratingValue)}
                            onMouseEnter={() => !readOnly && setHover(ratingValue)}
                            onMouseLeave={() => !readOnly && setHover(0)}
                            title={readOnly ? `Average: ${averageRating.toFixed(1)}` : `Rate ${ratingValue} stars`}
                        >
                            ★
                        </span>
                    );
                })}
            </div>
            <span className="rating-text">
                {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
            </span>
        </div>
    );
};

export default RatingComponent;
