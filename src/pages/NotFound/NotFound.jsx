import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css'; // создадим стили отдельно

const NotFound = ({ theme }) => {
  return (
    <div className={`not-found-container ${theme}`}>
      <h1 className="not-found-title">404</h1>
      <p className="not-found-text">Вупси! Такой странички нет :(</p>
      <Link to="/" className="not-found-link">Вернуться на домашнюю страничку</Link>
    </div>
  );
};

export default NotFound;
