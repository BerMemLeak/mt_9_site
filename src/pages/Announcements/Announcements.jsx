import React from "react";
import NewsCard from "../../components/newscard/NewsCard";
import {useContent} from "../../content/ContentContext";
import './Announcements.css'

// Основной компонент страницы
const Announcements = () => {
  const anonceData = useContent("announcements");
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
          attachments={news.attachments}
        />
      ))}
    </div>
  );
};

export default Announcements;
