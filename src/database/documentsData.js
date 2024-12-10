//документы 

export const documentsData = [
    {
      title: "Документы 2024-2025 учебный год",
      items: [
        { title: "Информация для выпускников", link: "http://design.bmstu.ru/assets/docs/Информация для выпускников.docx" },
      ],
    },
    {
      title: "Выпускная квалификационная работа",
      description: "Пояснительная записка, Задание на выполнение, Календарный план, Направление на защиту",
      items: [
        { title: "Титульные листы (Для бакалавров)", link: "/assets/docs/vkr-bak.docx" },
        { title: "Титульные листы (Для магистров)", link: "/assets/docs/vkr-mag.docx" },
        { title: "Образец рецензии на ВКР магистра (бакалавра)", link: "/assets/docs/review.doc" },
        { title: "Инструкция по оформлению ВКР и проверке на объем заимствования для студентов МГТУ им. Н.Э. Баумана", link: "/assets/docs/review.doc" },

      ],
    },
    {
      title: "Государственный экзамен",
      items: [
        { title: "Для бакалавров: Примерные вопросы для ГОС экзаменов", link: "/assets/pdf/gos-q-2021-54-03-01.pdf" },
        { title: "Для магистров: Примерные вопросы для ГОС экзаменов", link: "/assets/pdf/gos-q-2021-54-04-01.pdf" },
      ],
    },
    {
      title: "Практика для бакалавров",
      items: [
        { title: "Договор с приложениями для практики", link: "/assets/docs/contract-practice-2024-1.doc" },
        { title: "Памятка по практике", link: "/assets/pdf/practice-memo.pdf" },
        { title: "Пример Индивидуального задания (Для бакалавров)", link: "/assets/images/prakt-ind-mission-bak-2017.png" },
      ], 
      table: [
        {title: "1семестр", group: "мт9-11м", practice_type: "Педагогическая", date: "(07.02.2025 - 10.06.2025)", words:[
          {name: "Титул", link: "/assets/docs/contract-practice-2024-1.doc" },
          {name: "Задание", link: "/assets/docs/contract-practice-2024-1.doc" },
          {name: "Дополнение к заданию", link: "/assets/docs/contract-practice-2024-1.doc" },
        ]},
        {title: "2 семестр", group: "МТ9-31Б", practice_type: "Творческая", date: "(01.09.2024 - 30.12.2024)", words:[
          {name: "Титул", link: "/assets/docs/contract-practice-2024-1.doc" }
        ]},
        {title: "3 семестр", group: "МТ9-31Б", practice_type: "Творческая", date: "(07.02.2025 - 10.06.2025)", words:[
          {name: "Титул", link: "/assets/docs/contract-practice-2024-1.doc" },
          {name: "Задание", link: "/assets/docs/contract-practice-2024-1.doc" },
          {name: "Дополнение к заданию", link: "/assets/docs/contract-practice-2024-1.doc" },        ]},
      ]
    },






    {
      title: "Программы профессиональной переподготовки",
      items: [
        { title: "Методические указания для подготовки и защиты итоговой аттестационной работы", link: "/assets/pdf/pp-iar.pdf" },
        { title: "Титульные листы для РПЗ (в формате Word)", link: "/assets/docs/rpz-iar.doc" },
        { title: "Титул для практики по получению первичных профессиональных умений", link: "/assets/pdf/practice-title-mt9.pdf" },
        { title: "Задание для практики по получению первичных профессиональных умений", link: "/assets/pdf/practice-itask-mt9.pdf" },
        { title: "Вопросы для проведения междисциплинарного экзамена", link: "/assets/pdf/questionspp.pdf" },
      ],
    },
  ];
  