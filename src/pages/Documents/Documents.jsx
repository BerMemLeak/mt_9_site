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
          {category.table && ( // Проверяем наличие таблицы
            <div className="category-table">
              <h3>Таблица:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Семестр</th>
                    <th>Группа</th>
                    <th>Тип практики</th>
                    <th>Дата</th>
                    <th>Ссылки</th>
                  </tr>
                </thead>
                <tbody>
                  {category.table.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>{row.title}</td>
                      <td>{row.group}</td>
                      <td>{row.practice_type}</td>
                      <td>{row.date}</td>
                      <td>
                        {row.words.map((word, wordIndex) => (
                          <p key={wordIndex}>
                            <a href={word.link} target="_blank" rel="noopener noreferrer">
                              {word.name}
                            </a>
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Documents;
