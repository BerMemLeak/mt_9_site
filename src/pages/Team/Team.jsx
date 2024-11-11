import React from 'react';
import TeacherCard from '../../components/teachercard/TeacherCard';
import { teachers } from "../../database/teachersData"; // Импортируем преподавателей
import './Team.css'
const Team = () => {
  return (
    <div className="team-container">
      {teachers.map((teacher, index) => (
        <TeacherCard
          key={index}
          photo={teacher.photo}
          name={teacher.name}
          position={teacher.position}
          description={teacher.description}
        />
      ))}
    </div>
  );
};

export default Team;
