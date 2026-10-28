export const titles = {announcements:'Анонсы',news:'Новости',teachers:'Преподаватели',cases:'Проекты',
  education:'Образование',disciplines:'Дисциплины',schedules:'Расписания',documents:'Документы',pages:'Страницы',courses:'Курсы'};
export const labels = {
  record:'Материал',
  title:'Заголовок',subtitle:'Подзаголовок',description:'Описание',content:'Текст',body:'Содержание',
  date:'Дата',image:'Обложка',images:'Галерея',photo:'Фотография',name:'Название / имя',
  position:'Должность',link:'Ссылка',href:'Адрес ссылки',text:'Текст',file:'Файл',group:'Группа',
  updated:'Дата обновления',level:'Уровень',methods:'Учебные материалы',items:'Документы',table:'Практика',
  practice_type:'Вид практики',words:'Файлы практики',mainHigher:'Основное высшее образование',
  secondHigher:'Второе высшее образование',secondaryProfessional:'Среднее профессиональное образование',
  bachelor:'Бакалавриат',master:'Магистратура',direction:'Направление',profile:'Профиль',
  qualification:'Квалификация',exams:'Вступительные испытания',imgSrc:'Изображение',links:'Ссылки',
  address:'Адрес',phone:'Телефон',buttonClass:'Оформление кнопки',attachments:'Прикреплённые файлы',url:'Адрес файла'};
const blankLink = {text:'',href:''};
export const templates = {
  announcements:{title:'',subtitle:'',description:'',image:'',link:{text:'Подробнее',href:''},attachments:[]},
  news:{title:'',date:'',content:'',images:[],attachments:[]},
  teachers:{name:'',position:'',description:'',photo:''},
  cases:{title:'',subtitle:'',description:'',image:'',attachments:[]},
  disciplines:{title:'',level:'Бакалавриат',methods:[]},
  schedules:{group:'',file:'',updated:''},
  documents:{title:'',description:'',items:[],table:[]},
  pages:{title:'',body:''},courses:{title:''},education:{title:''}
};
export const arrayTemplates = {
  images:'',items:{title:'',link:''},methods:{name:'',link:''},links:blankLink,
  exams:{imgSrc:'',text:''},words:{name:'',link:''},attachments:{name:'',url:''},
  table:{title:'',group:'',practice_type:'',date:'',words:[]}
};
export const clone = value=>JSON.parse(JSON.stringify(value));
