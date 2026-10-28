import React from 'react';
import ContentPage from '../../content/ContentPage';
import {useContent} from '../../content/ContentContext';
import TeacherCard from '../../components/teachercard/TeacherCard';
import Marquee from '../../components/marquee/Marquee';
import './Home.css';
import '../../components/marquee/Marquee.css';
import '../../components/newscard/NewsCard.css';
import '../../components/teachercard/TeacherCard.css';
import '../../components/linkbutton/Linkbutton.css';
export default function Home({theme}){
  const teachers=useContent('teachers');
  const courses=useContent('courses');
  return <>
    <Marquee items={teachers.map(teacher=><TeacherCard key={teacher.id} {...teacher}/>)}/>
    <ContentPage id="home" theme={theme}/>
    <a href="https://isot.bmstu.ru/dop/k-design/" className="course-title">Дополнительные курсы</a>
    <Marquee items={courses.map(course=>course.title)}/>
  </>;
}
