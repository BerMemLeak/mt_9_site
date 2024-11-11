import React, { useState } from 'react';
import './Educations.css'; 
import { educationData } from '../../database/educationData';
const Educations = ({ theme }) => {
    const [activeTab, setActiveTab] = useState({ mainHigher: 'bachelor', secondHigher: 'bachelor' });
    const [selectedEducationType, setSelectedEducationType] = useState('mainHigher');

    const handleMainHigherTabChange = (tab) => {
    setActiveTab(prev => ({ ...prev, mainHigher: tab }));
  };

  const handleSecondHigherTabChange = (tab) => {
    setActiveTab(prev => ({ ...prev, secondHigher: tab }));
  };

  const handleEducationTypeChange = (event) => {
    setSelectedEducationType(event.target.value);
  };

  return (
    <div className={`design-container ${theme}`}>
      <div className="education-type-selector">
        <label htmlFor="education-type">Выберите тип образования:</label>
        <select id="education-type" value={selectedEducationType} onChange={handleEducationTypeChange}>
          <option value="mainHigher">Основное высшее образование</option>
          <option value="secondHigher">Второе высшее образование</option>
          <option value="secondaryProfessional">Среднее профессиональное образование</option>
        </select>
      </div>

      {selectedEducationType === 'mainHigher' && (
        <div>
          <div className="tab-buttons">
            <h2>Основное высшее образование</h2>
            <button onClick={() => handleMainHigherTabChange('bachelor')} className={activeTab.mainHigher === 'bachelor' ? 'active' : ''}>
              Бакалавр
            </button>
            <button onClick={() => handleMainHigherTabChange('master')} className={activeTab.mainHigher === 'master' ? 'active' : ''}>
              Магистр
            </button>
          </div>
          <h2 className="secondEducationColor">{educationData.mainHigher[activeTab.mainHigher].subtitle}</h2>

                <p>Направление подготовки - {educationData.mainHigher[activeTab.mainHigher].direction}</p>
                <p>Направленность - {educationData.mainHigher[activeTab.mainHigher].profile}</p>
                <p>Квалификация - {educationData.mainHigher[activeTab.mainHigher].qualification}</p>
            <h3>Вступительные испытания</h3>
            <ul className="exams-list">
              {educationData.mainHigher[activeTab.mainHigher].exams.map((exam, index) => (
                <li key={index}>
                  <img alt="" src={exam.imgSrc} />
                  <p>{exam.text}</p>
                </li>
              ))}
            </ul>
            <ul className="links-list">
              {educationData.mainHigher[activeTab.mainHigher].links.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className={link.buttonClass}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
            <div>
              <p>Консультации, оформление документов и выдача расписания занятий:</p>
              <p>{educationData.mainHigher[activeTab.mainHigher].address}</p>
              <p>{educationData.mainHigher[activeTab.mainHigher].phone}</p>
            </div>
        </div>
      )}

      {selectedEducationType === 'secondHigher' && (
        <div>
          <div className="tab-buttons">
            <h2>Второе высшее образование</h2>
            <button onClick={() => handleSecondHigherTabChange('bachelor')} className={activeTab.secondHigher === 'bachelor' ? 'active' : ''}>
              Бакалавр
            </button>
            <button onClick={() => handleSecondHigherTabChange('master')} className={activeTab.secondHigher === 'master' ? 'active' : ''}>
              Магистр
            </button>
          </div>
          <h2 className="secondEducationColor">{educationData.secondHigher[activeTab.secondHigher].subtitle}</h2>
                <p>Направление подготовки - {educationData.secondHigher[activeTab.secondHigher].direction}</p>
                <p>Направленность - {educationData.secondHigher[activeTab.secondHigher].profile}</p>
                <p>Квалификация - {educationData.secondHigher[activeTab.secondHigher].qualification}</p>
            <h3>Вступительные испытания</h3>
            <ul className="exams-list">
              {educationData.secondHigher[activeTab.secondHigher].exams.map((exam, index) => (
                <li key={index}>
                  <img alt="" src={exam.imgSrc} />
                  <p>{exam.text}</p>
                </li>
              ))}
            </ul>
            <ul className="links-list">
              {educationData.secondHigher[activeTab.secondHigher].links.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className={link.buttonClass}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
            <div>
              <p>Консультации, оформление документов и выдача расписания занятий:</p>
              <p>{educationData.secondHigher[activeTab.secondHigher].address}</p>
              <p>{educationData.secondHigher[activeTab.secondHigher].phone}</p>
            </div>
        </div>
      )}

      {selectedEducationType === 'secondaryProfessional' && (
        <div className="secondary-professional">
          <h2>{educationData.secondaryProfessional.title}</h2>
          <p>{educationData.secondaryProfessional.description}</p>
          <p>{educationData.secondaryProfessional.address}</p>
          <p>{educationData.secondaryProfessional.phone}</p>
        </div>
      )}
    </div>
  );
};

export default Educations;