import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Добавьте файл для стилей
import logo_light from "../../assets/logo_light.png";
import logo_dark from "../../assets/logo_dark.png";

const Navbar = ({ isDarkTheme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Функция для проверки ширины окна
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    // Проверяем ширину окна при первой загрузке
    handleResize();

    // Добавляем слушатель для изменения размеров окна
    window.addEventListener("resize", handleResize);

    // Убираем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`navbar-links ${isMobile ? "mobile" : ""}`}>
      
      <nav>
        
        <ul className="navbar">
        <div className="logo-container">
            <img src={isDarkTheme? logo_dark : logo_light} alt="Логотип" className="logo" />
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={isDarkTheme}
              onChange={toggleTheme}
            />
            <span className="slider">
              <span className="circle">
                <span className="shine shine-1"></span>
                <span className="shine shine-2"></span>
                <span className="shine shine-3"></span>
                <span className="shine shine-4"></span>
                <span className="shine shine-5"></span>
                <span className="shine shine-6"></span>
                <span className="shine shine-7"></span>
                <span className="shine shine-8"></span>
                <span className="moon"></span>
              </span>
            </span>
          </label>

          <li>
            <Link to="/">Главная</Link>
          </li>
          <li>
            <Link to="/announcements">Анонсы</Link>
          </li>
          <li>
            <Link to="/news">Новости</Link>
          </li>
          <li>
            <Link to="/team">Команда</Link>
          </li>
          <li>
            <Link to="/about">История</Link>
          </li>
          <li>
            <Link to="/cases">Кейсы</Link>
          </li>
          <li>
            <Link to="/contacts">Контакты</Link>
          </li>
          <li
            className="burger"
            onMouseEnter={toggleMenu}
            onMouseLeave={toggleMenu}
          >
            Обучение
            <ul className={`dropdown ${isOpen ? "open" : ""}`}>
              <li>
                <Link to="/educations">Образование</Link>
              </li>
              <li>
                <Link to="/stepInFuture">Шаг в будущее</Link>
              </li>
              <li>
                <Link to="/disciplines">Дисциплины</Link>
              </li>
              <li>
                <Link to="/schedule">Расписания</Link>
              </li>
              <li>
                <Link to="/documents">Документы</Link>
              </li>
            </ul>
          </li>

        </ul>

      </nav>
    </div>
  );
};

export default Navbar;
