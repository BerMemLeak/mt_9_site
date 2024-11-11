import React, { useState } from "react";
import "./ExpandableSection.css";
import { newsData } from "../../database/news_data";

const ExpandableSection = ({ title, content, images }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  return (
    <div className="expandable-section">
      <div className="header" onClick={toggleOpen}>
        <h2>{title}</h2>
        <button className="toggle-button">
          {isOpen ? "Скрыть" : "Показать больше"}
        </button>
      </div>
      <div className={`content ${isOpen ? "open" : "closed"}`}>
        <div className="text-content">
          <p>{content}</p>
        </div>
        <div className="image-gallery">
          {images.map((img, index) => (
            <img key={index} src={img} alt={`Gallery ${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ExpandableSections = () => {
  return (
    <div>
      {newsData.map((section, index) => (
        <ExpandableSection
          key={index}
          title={section.title}
          content={section.content}
          images={section.images}
        />
      ))}
    </div>
  );
};

export default ExpandableSections;
