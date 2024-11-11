import React from 'react';
import './Marquee.css'; // Стили для страницы

const Marquee = ({ items }) => {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {items.map((item, index) => (
          <div key={index} className="marquee-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
