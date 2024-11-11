import React from 'react';


import './Contacts.css';

const Contacts =  ({ theme }) => {
  return (
    <div className={`contact-info ${theme}`}>
      <p className="contact">
        <strong>Наш адрес:</strong>
      </p>
      <p className="contact">
        105005, Г. МОСКВА, ВН.ТЕР.Г. МУНИЦИПАЛЬНЫЙ ОКРУГ
      </p>
      <p className="contact">
        БАСМАННЫЙ УЛ. 2-Я БАУМАНСКАЯ, Д. 5, СТР. 1
      </p>
      <p className="contact">
        Тел.: +7 (499) 263-68-70
      </p>
      <p className="contact">
        E-mail: <a href="mailto:promdesign@bmstu.ru">promdesign@bmstu.ru</a>
      </p>
      <p className="contact">
        <strong>Схема проезда:</strong>
      </p>
      <div className="contact-image">
        <img src="http://design.bmstu.ru/plan_prohoda.jpg" alt="Схема проезда" />
      </div>
      <p className="contact">
        <strong>Как нас найти:</strong>
      </p>
      <div className="contact-image">
        <img src="http://design.bmstu.ru/ru/modules/pages/files/13/2.jpg" alt="Как нас найти" />
      </div>
    </div>
  );
};
export default Contacts;
