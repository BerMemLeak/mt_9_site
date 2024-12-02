// src/pages/Home/Home.js
import React from "react";
import "./Home.css"; // Стили для страницы
import Marquee from "../../components/marquee/Marquee";
import NewsCard from "../../components/newscard/NewsCard";
import TeacherCard from "../../components/teachercard/TeacherCard";

import { subjects } from "../../database/dop_curses"; // Импортируем предметы
import { teachers } from "../../database/teachersData"; // Импортируем преподавателей

const Home = () => {
  const teacherCards = teachers.map((teacher, index) => (
    <TeacherCard
      key={index}
      photo={teacher.photo}
      name={teacher.name}
      position={teacher.position}
      description={teacher.description}
    />
  ));

  return (
    <div className="course-container">

      <Marquee items={teacherCards} />

      <NewsCard
        title="Подготовительные курсы"
        subtitle="Концептуальное эскизирование в дизайне"
        image="https://mgppu.ru/resources/images/projects/%D0%A4%D0%BE%D1%82%D0%BE%201.jpg"
        description={
          <>
            <p>
              <strong>Начало занятий:</strong> 7 декабря 2024г.
            </p>
            <p>
              <strong>Режим занятий:</strong> один раз в неделю (суббота)
              <br />
              <strong>Время:</strong> 12:00 - 15:00
              <br />
              Формат занятий - очно с применением дистанционных технологий
            </p>
          </>
        }
        link={{ href: "https://isot.bmstu.ru/dop/k-design/" }}
      />
      <NewsCard
        title="Как не заблудиться в университете?"
        image="http://design.bmstu.ru/assets/images/kak_ne_zabluditsya.jpeg"
        subtitle="Наименования и сокращения корпусов МГТУ им. Н.Э. Баумана."
        description={
          <>
            <ul>
              <li>
                Главный учебный корпус &mdash; <strong>ГУК</strong>
              </li>
              <li>
                Многофункциональный научно-образовательный корпус (МНОК) &mdash;
                <strong>МНОК</strong>, корпус факультета МТ
              </li>
              <li>
                Многофункциональный библиотечный комплекс &mdash; <strong>ХимЛаб</strong>
              </li>
              <li>
                Корпус факультета «Инженерный бизнес» &mdash; <strong>ИБМ</strong>
              </li>
              <li>
                Исследовательский центр &mdash; <strong>ПИШ</strong>
              </li>
              <li>
                Центр биомедицинских систем и технологий и факультета биомедицинской техники &mdash;
                <strong>БМТ</strong>
              </li>
              <li>
                Учебно-лабораторный корпус &mdash; <strong>УЛК</strong>
              </li>
              <li>
                Инжиниринговый центр наземных транспортно-технологических систем &mdash;
                <strong>НТС</strong>
              </li>
              <li>
                Спортивный комплекс &mdash; <strong>СК</strong>
              </li>
              <li>
                Корпус факультета «Специальное машиностроение» &mdash; <strong>СМ</strong>
              </li>
              <li>
                Корпус факультета «Энергомашиностроение» &mdash; <strong>Энерго</strong>
              </li>
              <li>
                Научно-образовательный медико-технологический центр МГТУ им. Баумана &mdash;
                <strong>НОМТЦ</strong>
              </li>
              <li>
                Инжиниринговый центр имени А.А. Лиагарта. Группы ГАЗ &mdash; <strong>ЛИПГАРТ</strong>
              </li>
              <li>
                Инжиниринговый центр «Автоматика и робототехника» &mdash; <strong>ИЦАР</strong>
              </li>
            </ul>
            <p>
              Подробную карту <em>кампуса МГТУ им. Баумана</em> смотрите на
              <a
                href="https://bmstu.ru/for-students/navigation"
                className="link"
              >
                {" "}
                сайте{" "}
              </a>
              .
            </p>
            <p>
              👀 В социальных сетях Студенческого совета в
              <a href="https://vk.com/studsovet_bmstu" className="link">
                {" "}
                ВК{" "}
              </a>{" "}
              и
              <a href="https://t.me/studsovet_bmstu" className="link">
                {" "}
                Телеграме{" "}
              </a>{" "}
              вы найдете много полезной информации, подписывайтесь!
            </p>
          </>
        }

      />

      <a href="https://isot.bmstu.ru/dop/k-design/" className="course-title">
        Дополнительные курсы
      </a>

      <Marquee items={subjects} />
      {/* Другие компоненты */}
    </div>
  );
};

export default Home;
