// src/components/NewsCard/NewsCard.js
import React from "react";
import "./NewsCard.css"; // Стили для карточки
import LinkButton from "../linkbutton/LinkButton"; // Импорт компонента кнопки

const NewsCard = ({ title, subtitle, description, link, image }) => {
  return (
    <div className="card">
      <div className="card-info">
        <h1 className="card-title">{title}</h1>
        <h2 className="card-subtitle">{subtitle}</h2>
        {description}
        <div className="card-action">
          {link && <LinkButton link={link} />}
        </div>
      </div>
      {image && (
        <div className="card-image">
          <img src={image} alt={title} />
        </div>
      )}
    </div>
  );
};

export default NewsCard;
