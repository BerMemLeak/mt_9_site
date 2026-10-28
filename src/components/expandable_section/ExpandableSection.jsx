import React, { useState } from "react";
import "./ExpandableSection.css";
import {useContent, RichText} from "../../content/ContentContext";

const ExpandableSection = ({ date, title, content, images = [], attachments = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  return (
    <div className="expandable-section">
      <div className="header" onClick={toggleOpen}>
        <h2 style={{ color: '#1e90ff' }}>{date}</h2>
        <h2>{title}</h2>
        <button className="toggle-button" aria-expanded={isOpen}>
          {isOpen ? "Скрыть" : "Показать больше"}
        </button>
      </div>
      <div className={`content ${isOpen ? "open" : "closed"}`}>

        <div className="text-content">
          <RichText html={content}/>
          {attachments.map((file,i)=><p key={i}><a href={file.url}>{file.name || "Скачать файл"}</a></p>)}
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
  const newsData = useContent("news");
  return (
    <div>
      {newsData.map((section, index) => (
        <ExpandableSection
          key={index}
          date={section.date}
          title={section.title}
          content={section.content}
          images={section.images}
          attachments={section.attachments}
        />
      ))}
    </div>
  );
};

export default ExpandableSections;
