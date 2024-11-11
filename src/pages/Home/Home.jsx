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
      <NewsCard
        title="Подготовительные курсы"
        subtitle="Концептуальное эскизирование в дизайне"
        image="https://mgppu.ru/resources/images/projects/%D0%A4%D0%BE%D1%82%D0%BE%201.jpg"
        description={
          <>
            <p>
              <strong>Начало занятий:</strong> октябрь 2024г.
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
      <Marquee items={teacherCards} />
      <NewsCard
        title="Как не заблудиться в университете?"
        image="http://design.bmstu.ru/assets/images/kak_ne_zabluditsya.jpeg"
        subtitle="Наименования и сокращения корпусов МГТУ им. Н.Э. Баумана."
        description={
          <>
            <ul>
              <li>
                <strong>Главный учебный корпус</strong> &mdash; ГУК
              </li>
              <li>
                <strong>
                  Многофункциональный научно-образовательный корпус
                </strong>{" "}
                (МНОК) &mdash; корпус факультета МТ
              </li>
              <li>
                <strong>Многофункциональный библиотечный комплекс</strong>{" "}
                &mdash; ХимЛаб
              </li>
              <li>
                <strong>Корпус факультета «Инженерный бизнес»</strong> &mdash;
                ИБМ
              </li>
              <li>
                <strong>Исследовательский центр</strong> &mdash; ПИШ
              </li>
              <li>
                <strong>
                  Центр биомедицинских систем и технологий и факультета
                  биомедицинской техники
                </strong>{" "}
                &mdash; БМТ
              </li>
              <li>
                <strong>Учебно-лабораторный корпус</strong> &mdash; УЛК
              </li>
              <li>
                <strong>
                  Инжиниринговый центр наземных транспортно-технологических
                  систем
                </strong>{" "}
                &mdash; НТС
              </li>
              <li>
                <strong>Спортивный комплекс</strong> &mdash; СК
              </li>
              <li>
                <strong>Корпус факультета «Специальное машиностроение»</strong>{" "}
                &mdash; СМ
              </li>
              <li>
                <strong>Корпус факультета «Энергомашиностроение»</strong>{" "}
                &mdash; Энерго
              </li>
              <li>
                <strong>
                  Научно-образовательный медико-технологический центр МГТУ им.
                  Баумана
                </strong>{" "}
                &mdash; НОМТЦ
              </li>
              <li>
                <strong>
                  Инжиниринговый центр имени А.А. Лиагарта. Группы ГАЗ
                </strong>{" "}
                &mdash; ЛИПГАРТ
              </li>
              <li>
                <strong>
                  Инжиниринговый центр «Автоматика и робототехника»
                </strong>{" "}
                &mdash; ИЦАР
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

      <a href="https://t.me/studsovet_bmstu" className="course-title">
        Дополнительные курсы
      </a>

      <Marquee items={subjects} />
      {/* Другие компоненты */}
    </div>
  );
};

export default Home;
