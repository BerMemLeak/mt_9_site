import React from 'react';
import {useParams} from 'react-router-dom';
import {RichText, useContent} from './ContentContext';

export default function ContentPage({id,theme}) {
  const params = useParams();
  const page = useContent('pages').find(item=>item.id === (id || params.id));
  if (!page) return <main className="cms-page"><h1>Страница не опубликована</h1><a href="/">На главную</a></main>;
  const html=page.body.replace(/class="(design-container|contact-info) (?:light|dark)"/g,`class="$1 ${theme || 'light'}"`);
  return <main className={`cms-page ${theme || ''}`}><RichText html={html}/></main>;
}
