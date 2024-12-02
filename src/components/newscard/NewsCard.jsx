import React, { useEffect, useRef, useState } from "react";
import "./NewsCard.css";
import LinkButton from "../linkbutton/LinkButton";

const NewsCard = ({ title, subtitle, description, link, image }) => {
  const cardInfoRef = useRef(null);
  const [imageHeight, setImageHeight] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  const adjustImageSize = () => {
    if (cardInfoRef.current) {
      const textHeight = cardInfoRef.current.offsetHeight;
      setImageHeight(textHeight * 1);
    }
  };

  useEffect(() => {
    adjustImageSize();
    window.addEventListener("resize", adjustImageSize);
    return () => {
      window.removeEventListener("resize", adjustImageSize);
    };
  }, []);

  const handleImageClick = () => {
    setModalOpen(true);
  };

  const handleCloseModal = (e) => {
    if (e.target.className === "modal") {
      setModalOpen(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-info" ref={cardInfoRef}>
          <h1 className="card-title">{title}</h1>
          <h2 className="card-subtitle">{subtitle}</h2>
          <p>{description}</p>
          <div className="card-action">{link && <LinkButton link={link} />}</div>
        </div>
        {image && (
          <div className="card-image">
            <img
              src={image}
              alt={title}
              style={{ height: `${imageHeight}px`, width: "auto" }}
              onClick={handleImageClick}
              className="clickable-image"
            />
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="modal" onClick={handleCloseModal}>
          <img src={image} alt={title} className="modal-image" />
        </div>
      )}
    </>
  );
};

export default NewsCard;
