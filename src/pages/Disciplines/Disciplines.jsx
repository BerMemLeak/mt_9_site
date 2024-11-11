import React, { useState } from 'react';
import disciplinesData from '../../database/disciplinesData';
import './Disciplines.css';

const Disciplines = ({ theme }) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);

  const handleDisciplineClick = (discipline) => {
    if (selectedDiscipline === discipline) {
      setSelectedDiscipline(null);
    } else {
      setSelectedDiscipline(discipline);
    }
  };

  // Фильтрация дисциплин по уровням
  const bachelorDisciplines = disciplinesData.filter(discipline => discipline.level === 'Бакалавриат');
  const masterDisciplines = disciplinesData.filter(discipline => discipline.level === 'Магистратура');

  return (
    <div className={`disciplines-container ${theme === 'dark' ? 'dark' : 'light'}`}>
      <h1 className="title">Дисциплины</h1>
      
      <h2 className="level-title">Бакалавриат</h2>
      <ul className="disciplines-list">
        {bachelorDisciplines.map((discipline, index) => (
          <li key={index} className="discipline-item">
            <button
              onClick={() => handleDisciplineClick(discipline)}
              className={`discipline-button ${selectedDiscipline === discipline ? 'active' : ''}`}
            >
              {discipline.title}
            </button>
            {selectedDiscipline === discipline && (
              <div className="materials-container">
                <h3 className="materials-title">Доступные материалы:</h3>
                <ul className="materials-list">
                  {discipline.methods.map((method, idx) => (
                    <li key={idx} className="material-item">
                      <a href={method.link} target="_blank" rel="noopener noreferrer" className="material-link">
                        {method.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
      
      <h2 className="level-title">Магистратура</h2>
      <ul className="disciplines-list">
        {masterDisciplines.map((discipline, index) => (
          <li key={index} className="discipline-item">
            <button
              onClick={() => handleDisciplineClick(discipline)}
              className={`discipline-button ${selectedDiscipline === discipline ? 'active' : ''}`}
            >
              {discipline.title}
            </button>
            {selectedDiscipline === discipline && (
              <div className="materials-container">
                <h3 className="materials-title">Доступные материалы:</h3>
                <ul className="materials-list">
                  {discipline.methods.map((method, idx) => (
                    <li key={idx} className="material-item">
                      <a href={method.link} target="_blank" rel="noopener noreferrer" className="material-link">
                        {method.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Disciplines;
