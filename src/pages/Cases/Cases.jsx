import React from "react";
import NewsCard from "../../components/newscard/NewsCard";
import anonceData from "../../database/cases";
import './Cases.css'

// Основной компонент страницы
const Cases = () => {
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
        />
      ))}
    </div>
  );
};

export default Cases;
