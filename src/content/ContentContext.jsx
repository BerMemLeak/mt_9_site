import React, {createContext, useContext, useEffect, useState} from 'react';
import DOMPurify from 'dompurify';

const ContentContext = createContext({});
const names = ['announcements','news','teachers','cases','education','disciplines','schedules','documents','pages','courses'];
export function ContentProvider({children}) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(names.map(async name => {
      const response = await fetch(`/api/content/${name}`, {signal: controller.signal});
      if (!response.ok) throw new Error('Не удалось загрузить материалы сайта. Попробуйте обновить страницу.');
      const result = await response.json();
      return [name,result.data];
    })).then(entries => setContent(Object.fromEntries(entries)))
      .catch(error => {if (error.name !== 'AbortError') setError(error.message);});
    return () => controller.abort();
  }, []);
  if (error) return <main role="alert" style={{padding:32}}><p>{error}</p><button onClick={()=>window.location.reload()}>Повторить</button><p><a href="/admin">Админка</a></p></main>;
  if (!content) return <p role="status" style={{padding:32}}>Загрузка материалов…</p>;
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
export function useContent(name) { return useContext(ContentContext)[name] || []; }
export function RichText({html, className}) {
  return <div className={className} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(String(html || ''))}} />;
}
