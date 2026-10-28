import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import DOMPurify from 'dompurify';
import {RichText} from '../content/ContentContext';
import {api, setCsrf, upload} from './api';
import {arrayTemplates, clone, labels, templates, titles} from './schema';
import './Admin.css';

const MediaContext = createContext({files:[],refresh:()=>{}});
const size = bytes => bytes >= 1024**3 ? `${(bytes/1024**3).toFixed(2)} ГБ` : `${(bytes/1024**2).toFixed(1)} МБ`;
const date = stamp=>new Date(stamp*1000).toLocaleString('ru-RU');
const richFields = new Set(['body','description','content']);
const fileFields = new Set(['image','photo','imgSrc','file','href','link','url']);

function RichEditor({value,onChange,label}) {
  const ref = useRef();
  useEffect(()=>{
    const safe = DOMPurify.sanitize(value || '');
    if (ref.current && ref.current.innerHTML !== safe) ref.current.innerHTML = safe;
  },[value]);
  const command = (name,arg)=>{ref.current.focus(); document.execCommand(name,false,arg); onChange(ref.current.innerHTML);};
  return <div className="rich-editor">
    <div className="editor-tools" role="toolbar" aria-label="Форматирование текста">
      {[['bold','Жирный'],['italic','Курсив'],['insertUnorderedList','Список'],['insertOrderedList','Нумерация']].map(([name,text])=>
        <button type="button" key={name} onMouseDown={e=>e.preventDefault()} onClick={()=>command(name)}>{text}</button>)}
      <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{const url=window.prompt('Адрес ссылки (https://… или /uploads/…)');if(url && /^(https?:\/\/|\/|mailto:|tel:)/.test(url)) command('createLink',url);}}>Ссылка</button>
      <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>command('removeFormat')}>Убрать форматирование</button>
    </div>
    <div ref={ref} className="editable" role="textbox" aria-label={label} aria-multiline="true" contentEditable suppressContentEditableWarning
      onInput={()=>onChange(ref.current.innerHTML)} onPaste={event=>{
        event.preventDefault();
        const html=event.clipboardData.getData('text/html');
        if(html) command('insertHTML',DOMPurify.sanitize(html));
        else command('insertText',event.clipboardData.getData('text/plain'));
      }}/>
  </div>;
}

function FileField({value,onChange,label}) {
  const {files,refresh} = useContext(MediaContext);
  const [progress,setProgress]=useState(null), [error,setError]=useState('');
  async function select(file) {
    if (!file) return;
    if(file.size > 2*1024**3){setError('Максимальный размер — 2 ГБ');return;}
    setProgress(0);setError('');
    try {const result=await upload('upload',file,setProgress);onChange(result.url);await refresh();}
    catch(error){setError(error.message);}finally{setProgress(null);}
  }
  return <div className="file-field">
    <input aria-label={label} value={value || ''} onChange={e=>onChange(e.target.value)} placeholder="Адрес файла или ссылки"/>
    <div className="file-actions"><label className="button">Загрузить файл<input type="file" disabled={progress!==null} onChange={e=>{select(e.target.files[0]);e.target.value='';}}/></label>
    <select aria-label={`Выбрать файл: ${label}`} value="" onChange={e=>{if(e.target.value)onChange(e.target.value);}}>
      <option value="">Из загруженных файлов…</option>{files.map(file=><option key={file.id} value={file.url}>{file.name}</option>)}
    </select></div>
    {progress!==null && <p role="status">{progress<100 ? `Загрузка: ${progress}%` : 'Файл загружен, сервер сохраняет данные…'}<progress max="100" value={progress}/></p>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}

function Field({field,value,onChange,path=field}) {
  const label=labels[field] || field;
  if(field === 'id' || field === 'buttonClass' || field.startsWith('_')) return null;
  if(Array.isArray(value)) return <fieldset className="nested"><legend>{label}</legend>
    {value.map((item,index)=><div className="array-item" key={index}>
      <Field field={typeof item==='string' && field==='images' ? 'image' : field+'Item'} value={item}
        path={`${path}-${index}`} onChange={next=>onChange(value.map((old,i)=>i===index?next:old))}/>
      <button type="button" className="danger subtle" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Удалить элемент</button>
    </div>)}
    <button type="button" onClick={()=>onChange([...value,clone(arrayTemplates[field] ?? (value[0] || ''))])}>+ Добавить</button>
  </fieldset>;
  if(value && typeof value==='object') return <fieldset className="nested"><legend>{label}</legend>
    {Object.entries(value).map(([key,entry])=><Field key={key} field={key} value={entry} path={`${path}-${key}`} onChange={next=>onChange({...value,[key]:next})}/>)}</fieldset>;
  if(richFields.has(field)) return <div className="field"><span className="field-label">{label}</span><RichEditor label={label} value={value} onChange={onChange}/></div>;
  if(fileFields.has(field)) return <div className="field"><span className="field-label">{label}</span><FileField label={label} value={value} onChange={onChange}/></div>;
  return <label className="field" htmlFor={path}><span>{label}</span>
    {field==='level' ? <select id={path} value={value} onChange={e=>onChange(e.target.value)}><option>Бакалавриат</option><option>Магистратура</option></select>
      : <input id={path} value={value ?? ''} onChange={e=>onChange(e.target.value)}/>}
  </label>;
}

function Backups() {
  const [state,setState]=useState({files:[],jobs:[]}),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [progress,setProgress]=useState(null),[selected,setSelected]=useState(null),[confirmed,setConfirmed]=useState(false);
  const mounted = useRef(true);
  const refresh = async()=>{try{const next=await api('backups');if(mounted.current)setState(next);}catch(error){if(mounted.current)setError(error.message);}};
  useEffect(()=>{mounted.current=true;refresh();const timer=setInterval(refresh,3000);return()=>{mounted.current=false;clearInterval(timer);};},[]); // eslint-disable-line react-hooks/exhaustive-deps
  const run=async action=>{setError('');setMessage('');try{await action();await refresh();}catch(error){setError(error.message);}};
  async function restore() {
    if(!selected || !confirmed) return;
    setProgress(0);
    try {
      await upload('restore',selected,setProgress,{confirm:'RESTORE'});
      setMessage('Архив передан. Проверка и восстановление выполняются в фоне — следите за статусом ниже.');
      setSelected(null);setConfirmed(false);
    } finally {setProgress(null);}
  }
  const jobs=[...state.jobs].reverse();
  return <section>
    <h2>Резервные копии</h2><p>Один ZIP-архив содержит базу данных и все загруженные файлы. Автоматические копии создаются раз в неделю и хранятся два календарных месяца. Старые удаляются после успешного создания новой.</p>
    <p className="notice">Копии на этом сервере не защищают от потери его диска. Периодически скачивайте архив и храните отдельно.</p>
    <p>Последняя автоматическая копия: {state.last_scheduled?date(state.last_scheduled):'ещё не создана'}. Следующая: {state.next_scheduled?date(state.next_scheduled):'при запуске планировщика'}.</p>
    {state.last_error && <p role="alert" className="error">Последняя ошибка: {state.last_error}</p>}
    <button disabled={state.busy || progress!==null} onClick={()=>run(()=>api('backups',{method:'POST',body:'{}'}))}>Создать резервную копию</button>
    <ul className="backup-list">{state.files.map(file=><li key={file.name}><a href={`/api/admin/backups/${file.name}`}>{file.name}</a><span>{size(file.size)} · {date(file.created)}</span></li>)}</ul>
    {!state.files.length && <p>Резервных копий пока нет.</p>}
    <h3>Восстановить сайт из копии</h3><p>Принимается ZIP-архив, созданный этим сайтом. Текущие материалы и файлы будут заменены. Перед заменой автоматически создаётся контрольная копия. Архив не меняет пароль администратора.</p>
    <input aria-label="Архив резервной копии" type="file" accept=".zip" disabled={state.busy || progress!==null} onChange={e=>setSelected(e.target.files[0] || null)}/>
    <label className="confirmation"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Подтверждаю замену текущих данных содержимым копии</label>
    <button className="danger" disabled={!selected || !confirmed || state.busy || progress!==null} onClick={()=>run(restore)}>Проверить архив и восстановить</button>
    {progress!==null && <p role="status">Передача архива: {progress}%<progress value={progress} max="100"/></p>}
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="error">{error}</p>}
    <div aria-live="polite">{jobs.map(job=><p key={job.id} className={job.status==='failed'?'error':'notice'}>{job.kind==='restore'?'Восстановление':job.kind==='import'?'Перенос старых файлов':'Создание копии'}: {job.status==='running'?'выполняется':job.status==='done'?'завершено':job.message}{job.result?.safety_backup && <>. Контрольная копия: {job.result.safety_backup}</>}</p>)}</div>
  </section>;
}

function MediaLibrary() {
  const {files,refresh}=useContext(MediaContext);
  const [error,setError]=useState(''),[progress,setProgress]=useState(null);
  const [job,setJob]=useState(null);
  useEffect(()=>{
    if(!job || job.status!=='running')return;
    const timer=setInterval(()=>api(`jobs/${job.id}`).then(result=>{setJob(result);if(result.status==='done')refresh();}).catch(error=>setError(error.message)),3000);
    return()=>clearInterval(timer);
  },[job,refresh]);
  return <section><h2>Загруженные файлы</h2><p>Фото, документы, видео и архивы — до 2 ГБ на файл. Файлы сохраняются на сервере и входят в резервную копию.</p>
    <label className="button">Загрузить файл<input type="file" disabled={progress!==null} onChange={async e=>{
      const file=e.target.files[0]; e.target.value='';if(!file)return;
      if(file.size>2*1024**3){setError('Максимальный размер — 2 ГБ');return;}
      setProgress(0);setError('');try{await upload('upload',file,setProgress);await refresh();}catch(error){setError(error.message);}finally{setProgress(null);}
    }}/></label>
    {progress!==null && <p role="status">Загрузка: {progress}%<progress value={progress} max="100"/></p>}
    {error && <p role="alert" className="error">{error}</p>}
    <ul className="backup-list">{files.map(file=><li key={file.id}><a href={file.url} target="_blank" rel="noreferrer">{file.name}</a><span>{size(file.size)}</span><input aria-label={`Ссылка на ${file.name}`} readOnly value={file.url} onFocus={e=>e.target.select()}/></li>)}</ul>
    <p>Файлы можно выбирать в редакторе материалов. Удаление записи не удаляет её вложения, чтобы не сломать ссылки из других записей.</p>
    <h3>Перенос старых файлов</h3><p>Скопировать доступные фотографии и документы со старого сайта университета на этот сервер. Недоступные ссылки сохранятся; список ошибок появится ниже. Во время переноса не редактируйте материалы.</p>
    <button disabled={job?.status==='running'} onClick={async()=>{setError('');try{setJob(await api('import-legacy',{method:'POST',body:'{}'}));}catch(error){setError(error.message);}}}>Перенести старые файлы на сервер</button>
    {job && <div role="status"><p>{job.status==='running'?'Перенос выполняется в фоне. Это может занять несколько минут.':job.status==='failed'?job.message:`Перенесено файлов: ${job.result.imported}. Не удалось загрузить: ${job.result.failed.length}.`}</p>
      {job.result?.failed?.length>0 && <details><summary>Недоступные файлы</summary><ul>{job.result.failed.map((failure,index)=><li key={index}>{failure.url}: {failure.error}</li>)}</ul></details>}
      {job.result?.skipped_sections?.length>0 && <p>Некоторые разделы редактировались во время переноса. Повторите импорт для них: {job.result.skipped_sections.join(', ')}.</p>}
    </div>}
  </section>;
}

function Dashboard({logout}) {
  const [section,setSection]=useState('news'),[rows,setRows]=useState([]),[revision,setRevision]=useState(0);
  const [active,setActive]=useState(null),[dirty,setDirty]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [busy,setBusy]=useState(false),[query,setQuery]=useState(''),[preview,setPreview]=useState(false);
  const [files,setFiles]=useState([]);
  const refreshMedia=async()=>{const result=await api('media');setFiles(result.files);};
  useEffect(()=>{refreshMedia().catch(error=>setError(error.message));},[]);
  useEffect(()=>{
    const handler=event=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);
  },[dirty]);
  async function load(name) {
    setBusy(true);setError('');setMessage('');setActive(null);setQuery('');
    try {const result=await api(`content/${name}`);setRows(result.data);setRevision(result.revision);setDirty(false);}
    catch(error){setError(error.message);}finally{setBusy(false);}
  }
  useEffect(()=>{load('news');},[]);
  function switchSection(name) {
    if(dirty && !window.confirm('Есть несохранённые изменения. Перейти без сохранения?'))return;
    setSection(name);setDirty(false);setPreview(false);setError('');setMessage('');
    if(titles[name])load(name);
  }
  async function save() {
    setBusy(true);setError('');setMessage('');
    try {const result=await api(`content/${section}`,{method:'PUT',body:JSON.stringify({data:rows,revision})});setRows(result.data);setRevision(result.revision);setDirty(false);setMessage('Сохранено. Опубликованные материалы уже доступны на сайте.');}
    catch(error){setError(error.message);}finally{setBusy(false);}
  }
  const update = next=>{setRows(next);setDirty(true);setMessage('');};
  const entry=rows[active];
  return <MediaContext.Provider value={{files,refresh:refreshMedia}}><div className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">МТ9 · ПРОМЫШЛЕННЫЙ ДИЗАЙН</p><h1>Управление сайтом</h1></div><div className="header-actions"><a href="/" target="_blank" rel="noreferrer">Открыть сайт ↗</a><button onClick={()=>{if(!dirty || window.confirm('Выйти без сохранения изменений?'))logout();}}>Выйти</button></div></header>
    <nav className="admin-nav" aria-label="Разделы админки">{Object.entries({...titles,media:'Файлы',backups:'Резервные копии'}).map(([key,title])=><button key={key} disabled={busy} className={section===key?'selected':''} onClick={()=>switchSection(key)}>{title}</button>)}</nav>
    <main className="admin-main">{section==='backups'?<Backups/>:section==='media'?<MediaLibrary/>:<>
      <div className="section-heading"><div><h2>{titles[section]}</h2><p>{rows.length} материалов · {dirty?'есть несохранённые изменения':'все изменения сохранены'}</p></div><button className="primary" disabled={busy || !dirty} onClick={save}>{busy?'Сохранение…':'Сохранить изменения'}</button></div>
      {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
      <div className="admin-columns"><aside className="records"><input aria-label="Поиск материалов" placeholder="Найти материал…" value={query} onChange={e=>setQuery(e.target.value)}/>
        {section!=='education' && <button disabled={busy} onClick={()=>{const next={...clone(templates[section]),id:crypto.randomUUID(),_status:'draft'};if(section==='pages')next.id='page-'+Date.now();update([...rows,next]);setActive(rows.length);setPreview(false);}}>+ Добавить материал</button>}
        {rows.map((row,index)=>({row,index})).filter(({row})=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())).map(({row,index})=><button key={row.id || index} className={`record ${active===index?'selected':''}`} onClick={()=>{setActive(index);setPreview(false);}}><strong>{row.title || row.name || row.group || 'Без заголовка'}</strong><small>{row._status==='draft'?'Черновик':row._status==='archived'?'Архив':'Опубликовано'}</small></button>)}
      </aside><section className="record-editor">{entry?<>
        <div className="editor-heading"><h3>{entry.title || entry.name || entry.group || 'Новый материал'}</h3><button onClick={()=>setPreview(!preview)}>{preview?'Редактировать':'Предпросмотр'}</button></div>
        <label className="field"><span>Публикация</span><select value={entry._status || 'published'} onChange={e=>update(rows.map((row,i)=>i===active?{...row,_status:e.target.value}:row))}><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="archived">Архив</option></select></label>
        {section==='pages' && <p>Адрес: <a href={entry.id==='home'?'/':['about','contacts','stepInFuture'].includes(entry.id)?`/${entry.id}`:`/pages/${entry.id}`} target="_blank" rel="noreferrer">{entry.id==='home'?'/':`/${entry.id}`}</a></p>}
        {preview?<article className="content-preview"><h2>{entry.title || entry.name || entry.group}</h2>{entry.subtitle && <h3>{entry.subtitle}</h3>}{(entry.image || entry.photo)&&<img src={entry.image || entry.photo} alt=""/>}<RichText html={entry.body || entry.description || entry.content}/>{entry.file && <a href={entry.file}>Скачать файл</a>}{entry.images?.map((src,i)=><img src={src} key={i} alt=""/>)}{entry.attachments?.map((file,i)=><p key={i}><a href={file.url}>{file.name || 'Скачать файл'}</a></p>)}<p className="muted">Предпросмотр текста и вложений. Оформление конкретного раздела смотрите на сайте после публикации.</p></article>:
          <Field field="record" value={entry} path={`record-${entry.id}`} onChange={value=>update(rows.map((row,i)=>i===active?value:row))}/>}
        {!['education','pages'].includes(section) && <div className="record-controls"><button disabled={active===0} onClick={()=>{const next=[...rows];[next[active-1],next[active]]=[next[active],next[active-1]];update(next);setActive(active-1);}}>↑ Выше</button><button disabled={active===rows.length-1} onClick={()=>{const next=[...rows];[next[active+1],next[active]]=[next[active],next[active+1]];update(next);setActive(active+1);}}>↓ Ниже</button><button className="danger" onClick={()=>{if(window.confirm('Удалить материал? Для временного скрытия выберите статус «Архив».')){update(rows.filter((_,i)=>i!==active));setActive(null);}}}>Удалить материал</button></div>}
      </>:<p className="empty-state">{busy?'Загрузка…':'Выберите материал слева или добавьте новый.'}</p>}</section></div>
    </>}</main><footer className="admin-footer">Материалы публикуются без изменения кода и пересборки сайта.</footer>
  </div></MediaContext.Provider>;
}

export default function Admin() {
  const [user,setUser]=useState(null),[checking,setChecking]=useState(true),[error,setError]=useState(''),[pending,setPending]=useState(false);
  useEffect(()=>{api('session').then(result=>{setCsrf(result.csrf);setUser(result.username);}).catch(error=>{if(error.status!==401)setError(error.message);}).finally(()=>setChecking(false));},[]);
  if(checking)return <p className="admin-loading">Проверка входа…</p>;
  if(user)return <Dashboard logout={async()=>{try{await api('logout',{method:'POST',body:'{}'});setCsrf('');setUser(null);}catch(error){window.alert(error.message);}}}/>;
  return <main className="admin-login"><form onSubmit={async event=>{
    event.preventDefault();setError('');setPending(true);const values=new FormData(event.target);
    try{const result=await api('login',{method:'POST',body:JSON.stringify(Object.fromEntries(values))});setCsrf(result.csrf);setUser(result.username);}catch(error){setError(error.message);}finally{setPending(false);}
  }}><p className="eyebrow">МТ9 · АДМИНИСТРАТОР</p><h1>Вход в управление сайтом</h1><p>Материалы, файлы и резервные копии в одном месте.</p>
    <label className="field">Логин<input name="username" autoComplete="username" defaultValue="admin" required/></label>
    <label className="field">Пароль<input name="password" type="password" autoComplete="current-password" required/></label>
    {error && <p role="alert" className="error">{error}</p>}<button className="primary" disabled={pending}>{pending?'Вход…':'Войти'}</button><p><a href="/">Вернуться на сайт</a></p>
  </form></main>;
}
