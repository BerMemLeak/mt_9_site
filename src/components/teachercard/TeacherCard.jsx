import React from 'react';
import './TeacherCard.css'; // Подключение стилей для карточки преподавателя

const TeacherCard = ({ photo, name, position, description }) => {
  return (
    <div className="teacher-card">
      <div className="teacher-photo">
        <img src={photo} alt={name} />
      </div>
      <div className="teacher-info">
        <h2 className="teacher-name">{name}</h2>
        <p className="teacher-position">{position}</p>
        <p className="teacher-description">{description}</p>
      </div>
    </div>
  );
};

export default TeacherCard;
