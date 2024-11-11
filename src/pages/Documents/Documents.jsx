import React from 'react';
import './Documents.css'; // Импортируем CSS файл

const Documents = ({ theme }) => {
  const documentsData = [
    {
      title: "Информация для выпускников",
      link: "http://design.bmstu.ru/assets/docs/Информация для выпускников.docx",
    },
    {
      title: "Титульные листы (Для бакалавров)",
      link: "/assets/docs/vkr-bak.docx",
    },
    {
      title: "Титульные листы (Для магистров)",
      link: "/assets/docs/vkr-mag.docx",
    },
    {
      title: "Образец рецензии на ВКР магистра (бакалавра)",
      link: "/assets/docs/review.doc",
    },
    {
      title: "Инструкция по оформлению ВКР и проверке на объем заимствования",
      link: "/assets/pdf/pam_vkr.pdf",
    },
    {
      title: "Для бакалавров: Примерные вопросы для ГОС экзаменов",
      link: "/assets/pdf/gos-q-2021-54-03-01.pdf",
    },
    {
      title: "Для магистров: Примерные вопросы для ГОС экзаменов",
      link: "/assets/pdf/gos-q-2021-54-04-01.pdf",
    },
    {
      title: "Договор с приложениями для практики",
      link: "/assets/docs/contract-practice-2024-1.doc",
    },
    {
      title: "Памятка по практике",
      link: "/assets/pdf/practice-memo.pdf",
    },
    {
      title: "Пример Индивидуального задания (Для бакалавров)",
      link: "/assets/images/prakt-ind-mission-bak-2017.png",
    },
    {
      title: "Пример Индивидуального задания (Для магистров)",
      link: "/assets/images/prakt-ind-mission-mag-2017.png",
    },
    {
      title: "Методические указания для подготовки и защиты итоговой аттестационной работы",
      link: "/assets/pdf/pp-iar.pdf",
    },
    {
      title: "Титульные листы для РПЗ (в формате Word)",
      link: "/assets/docs/rpz-iar.doc",
    },
    {
      title: "Титул для практики по получению первичных профессиональных умений",
      link: "/assets/pdf/practice-title-mt9.pdf",
    },
    {
      title: "Задание для практики по получению первичных профессиональных умений",
      link: "/assets/pdf/practice-itask-mt9.pdf",
    },
    {
      title: "Вопросы для проведения междисциплинарного экзамена",
      link: "/assets/pdf/questionspp.pdf",
    },
  ];

  const categories = [
    {
      title: "Документы 2024-2025 учебный год",
      items: [documentsData[0]], // Только первый документ
    },
    {
      title: "Выпускная квалификационная работа",
      description: "Пояснительная записка, Задание на выполнение, Календарный план, Направление на защиту",
      items: documentsData.slice(1, 4), // Три документа для ВКР
    },
    {
      title: "Государственный экзамен",
      items: documentsData.slice(5, 7), // Для бакалавров и магистров
    },
    {
      title: "Практика для бакалавров",
      items: documentsData.slice(7, 10), // Для бакалавров
      table: true, // Для добавления таблицы
    },
    {
      title: "Программы профессиональной переподготовки",
      items: documentsData.slice(10), // Остальные документы
    },
  ];

  return (
    <div className="documents-container">
      {categories.map((category, index) => (
        <div key={index} className="category">
          <h2 className="category-title">{category.title}</h2>
          {category.description && (
            <p className="category-description">{category.description}</p>
          )}
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
                    <p>
                      <a href="/assets/docs/practice-2024/practice-2b-1.pdf" target="_blank" rel="noopener noreferrer">
                        Задание
                      </a> (2024)
                    </p>
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
