import React from "react";
import NewsCard from "../../components/newscard/NewsCard";
import {useContent} from "../../content/ContentContext";
import './Cases.css'

// Основной компонент страницы
const Cases = () => {
  const anonceData = useContent("cases");
  return (
    <div className="cases-container">
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

export default Cases;
