import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Admin from './admin/Admin';
import ContentPage from './content/ContentPage';
import {ContentProvider} from './content/ContentContext';

import Home from './pages/Home/Home';
import './pages/About/About.css';
import Announcements from './pages/Announcements/Announcements';
import News from './pages/News/News';
import Team from './pages/Team/Team';
import Cases from './pages/Cases/Cases';
import './pages/Contacts/Contacts.css';
import NotFound from './pages/NotFound/NotFound'; // Импортируем компонент для страницы 404
import Educations from './pages/Educations/Educations';
import './pages/StepInFuture/StepInFuture.css';
import Disciplines from './pages/Disciplines/Disciplines';
import ScheduleTable from './pages/ScheduleTable/ScheduleTable';
import Documents from './pages/Documents/Documents';

const PublicSite = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('isDarkTheme');
    return savedTheme === 'true';
  });

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  useEffect(() => {
    localStorage.setItem('isDarkTheme', isDarkTheme);
    document.body.classList.toggle('dark-theme', isDarkTheme);
  }, [isDarkTheme]);

  return (
    <Router>
      <div>
        <Navbar isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home theme={isDarkTheme ? 'dark' : 'light'}/>} />
          <Route path="/pages/:id" element={<ContentPage />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/news" element={<News />} />
          <Route path="/team" element={<Team />} />
          <Route path="/about" element={<ContentPage id="about" theme={isDarkTheme ? 'dark' : 'light'} />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/contacts" element={<ContentPage id="contacts" theme={isDarkTheme ? 'dark' : 'light'} />} /> {/* Передаем тему */}

          <Route path="/educations" element={<Educations theme={isDarkTheme ? 'dark' : 'light'} />} />

          <Route path="/stepInFuture" element={<ContentPage id="stepInFuture" theme={isDarkTheme ? 'dark' : 'light'} />}  /> {/* Компонент профиля */}
          <Route path="/disciplines" element={<Disciplines theme={isDarkTheme ? 'dark' : 'light'}/>} /> {/* Компонент для дисциплин */}
          <Route path="/schedule" element={<ScheduleTable theme={isDarkTheme ? 'dark' : 'light'}/>} />
          <Route path="/documents" element={<Documents theme={isDarkTheme ? 'dark' : 'light'} />} /> {/* Компонент документов */}

          <Route path="*" element={<NotFound theme={isDarkTheme ? 'dark' : 'light'} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default function App() {
  return window.location.pathname.startsWith("/admin") ? <Admin/> : <ContentProvider><PublicSite/></ContentProvider>;
}
