import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css"; // Добавьте файл для стилей
import logo_light from "../../assets/logo_light.png";
import logo_dark from "../../assets/logo_dark.png";

const Navbar = ({ isDarkTheme, toggleTheme }) => {
  const [isMobile, setIsMobile] = useState(false);

  const location = useLocation(); // Получаем текущий путь

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

  return (
    <div className={`navbar-links ${isMobile ? "mobile" : ""}`}>
      <nav>
        <ul className="navbar">
          <div className="logo-container">
            {/* Оборачиваем логотип в Link для перехода на главную страницу */}
            <Link to="/">
              <img src={isDarkTheme ? logo_dark : logo_light} alt="Логотип" className="logo" />
            </Link>
          </div>

          <li className={location.pathname === "/" ? "active" : ""}>
            <Link to="/">Главная</Link>
          </li>
          <li className={location.pathname === "/announcements" ? "active" : ""}>
            <Link to="/announcements">Анонсы</Link>
          </li>
          <li className={location.pathname === "/news" ? "active" : ""}>
            <Link to="/news">Новости</Link>
          </li>
          <li className={location.pathname === "/team" ? "active" : ""}>
            <Link to="/team">Команда</Link>
          </li>
          <li className={location.pathname === "/about" ? "active" : ""}>
            <Link to="/about">История</Link>
          </li>
          <li className={location.pathname === "/cases" ? "active" : ""}>
            <Link to="/cases">Работы</Link>
          </li>
          <li className={location.pathname === "/contacts" ? "active" : ""}>
            <Link to="/contacts">Контакты</Link>
          </li>
          <li className={location.pathname === "/educations" ? "active" : ""}>
            <Link to="/educations">Образование</Link>
          </li>
          <li className={location.pathname === "/stepInFuture" ? "active" : ""}>
            <Link to="/stepInFuture">Шаг в будущее</Link>
          </li>
          <li className={location.pathname === "/disciplines" ? "active" : ""}>
            <Link to="/disciplines">Дисциплины</Link>
          </li>
          <li className={location.pathname === "/schedule" ? "active" : ""}>
            <Link to="/schedule">Расписания</Link>
          </li>
          <li className={location.pathname === "/documents" ? "active" : ""}>
            <Link to="/documents">Документы</Link>
          </li>


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

        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
