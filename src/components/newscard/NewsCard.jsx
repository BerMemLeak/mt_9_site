import React, { useEffect, useRef, useState } from "react";
import "./NewsCard.css"; // Стили для карточки
import LinkButton from "../linkbutton/LinkButton"; // Импорт компонента кнопки

const NewsCard = ({ title, subtitle, description, link, image }) => {
  // Ссылка на контейнер с текстом и картинкой
  const cardInfoRef = useRef(null);
  const [imageHeight, setImageHeight] = useState(0);

  // Функция для динамической установки размера изображения
  const adjustImageSize = () => {
    if (cardInfoRef.current) {
      // Получаем высоту текстового контейнера
      const textHeight = cardInfoRef.current.offsetHeight;
      // Устанавливаем высоту изображения (например, 80% от высоты текста)
      setImageHeight(textHeight * 1);
    }
  };

  useEffect(() => {
    // Выполняем при монтировании компонента
    adjustImageSize();
    // Выполняем при изменении размера окна
    window.addEventListener("resize", adjustImageSize);

    // Убираем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener("resize", adjustImageSize);
    };
  }, []); // Пустой массив зависимостей означает, что хук выполнится только один раз при монтировании компонента

  return (
    <div className="card">
      <div className="card-info" ref={cardInfoRef}>
        <h1 className="card-title">{title}</h1>
        <h2 className="card-subtitle">{subtitle}</h2>
        <p>{description}</p>
        <div className="card-action">
          {link && <LinkButton link={link} />}
        </div>
      </div>
      {image && (
        <div className="card-image">
          <img
            src={image}
            alt={title}
            style={{ height: `${imageHeight}px`, width: "auto" }}
          />
        </div>
      )}
    </div>
  );
};

export default NewsCard;
