// src/components/NewsButton/NewsButton.js
import React from 'react';
import './Linkbutton.css'; // Стили для кнопки

const Linkbutton = ({ link }) => {
  return (
    <div className="course-action">
      <a href={link ? link.href : "#"} className="btn-blue">Подать заявку</a>
    </div>
  );
};

export default Linkbutton;
