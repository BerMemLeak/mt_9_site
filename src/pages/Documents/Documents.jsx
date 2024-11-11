import React from 'react';
import './Documents.css'; // Импортируем CSS файл
import { documentsData } from '../../database/documentsData';
const Documents = ({ theme }) => {
  

  return (
    <div className={`documents-container ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      {documentsData.map((category, index) => (
        <div key={index} className="category">
          <h2 className="category-title">{category.title}</h2>
          {category.description && <p className="category-description">{category.description}</p>}
          {category.items.map((doc, docIndex) => (
            <p key={docIndex} className="document-item">
              <a href={doc.link} target="_blank" rel="noopener noreferrer" className="document-link">
                {doc.title}
              </a>
            </p>
          ))}
          {category.table && (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Курс</th>
                  <th>Титульный лист и Задание</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1 курс</td>
                  <td>
                    <p><strong>Группы МТ9-21Б</strong></p>
                    <p>Учебно-ознакомительная практика</p>
                    <p>(07.02.2025 - 10.06.2025)</p>
                    <p><a href="/assets/pdf/TItul_21b.pdf">Титул</a> (2025)</p>
                    <p><a href="/assets/docs/practice-2024/practice-2b-1.pdf" target="_blank" rel="noopener noreferrer">Задание</a> (2024)</p>
                    <p><a href="/assets/pdf/practice-ind-mt9-2b-2020-add.pdf">Дополнение к заданию</a> (2020)</p>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default Documents;
