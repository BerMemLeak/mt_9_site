import React from "react";
import NewsCard from "../../components/newscard/NewsCard";
import anonceData from "../../database/announcementsData";
import './Announcements.css'

// Основной компонент страницы
const Announcements = () => {
  return (
    <div className="announcements-container">
      {anonceData.map((news) => (
        <NewsCard
          key={news.id}
          title={news.title}
          subtitle={news.subtitle}
          description={news.description}
          link={news.link}
          image={news.image}
        />
      ))}
    </div>
  );
};

export default Announcements;
