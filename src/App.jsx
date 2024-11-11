import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import CustomCursor from './components/cursor/CustomCursor'; // Импортируем кастомный курсор

import Home from './pages/Home/Home';
import About from './pages/About/About';
import Announcements from './pages/Announcements/Announcements';
import News from './pages/News/News';
import Team from './pages/Team/Team';
import Cases from './pages/Cases/Cases';
import Contacts from './pages/Contacts/Contacts';
import NotFound from './pages/NotFound/NotFound'; // Импортируем компонент для страницы 404
import Educations from './pages/Educations/Educations';
import StepInFuture from './pages/StepInFuture/StepInFuture';
import Disciplines from './pages/Disciplines/Disciplines';
import ScheduleTable from './pages/ScheduleTable/ScheduleTable';
import Documents from './pages/Documents/Documents';

const App = () => {
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
        {/* <CustomCursor /> {} */}
        <Navbar isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/news" element={<News />} />
          <Route path="/team" element={<Team />} />
          <Route path="/about" element={<About theme={isDarkTheme ? 'dark' : 'light'} />} />
          <Route path="/cases" element={<Cases />} />   
          <Route path="/contacts" element={<Contacts theme={isDarkTheme ? 'dark' : 'light'} />} /> {/* Передаем тему */} 

          <Route path="/educations" element={<Educations theme={isDarkTheme ? 'dark' : 'light'} />} /> 
          
          <Route path="/stepInFuture" element={<StepInFuture theme={isDarkTheme ? 'dark' : 'light'} />}  /> {/* Компонент профиля */}
          <Route path="/disciplines" element={<Disciplines theme={isDarkTheme ? 'dark' : 'light'}/>} /> {/* Компонент для дисциплин */}
          <Route path="/schedule" element={<ScheduleTable theme={isDarkTheme ? 'dark' : 'light'} n/>} /> {/* Компонент расписания */}
          <Route path="/documents" element={<Documents theme={isDarkTheme ? 'dark' : 'light'} />} /> {/* Компонент документов */}

          <Route path="*" element={<NotFound theme={isDarkTheme ? 'dark' : 'light'} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
