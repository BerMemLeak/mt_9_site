let csrf = '';
export function setCsrf(value) {csrf = value;}
export async function api(path, options={}) {
  const response = await fetch(`/api/admin/${path}`, {
    ...options, headers: {'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers}
  });
  const result = await response.json().catch(()=>({error:'Не удалось прочитать ответ сервера'}));
  if (!response.ok) {
    const error = new Error(result.error || 'Ошибка сервера');
    error.status = response.status;
    throw error;
  }
  return result;
}
export function upload(path, file, progress, fields={}) {
  return new Promise((resolve,reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/${path}`);
    xhr.setRequestHeader('X-CSRF-Token',csrf);
    xhr.upload.onprogress = event=>{if(event.lengthComputable) progress(Math.round(event.loaded/event.total*100));};
    xhr.onerror = ()=>reject(new Error('Соединение прервано. Проверьте сеть и повторите загрузку.'));
    xhr.onload = ()=>{
      let result;
      try {result = JSON.parse(xhr.responseText);} catch {return reject(new Error(`Ошибка загрузки (${xhr.status}). Проверьте размер файла и настройки сервера.`));}
      if (xhr.status >= 400) return reject(new Error(result.error || 'Ошибка загрузки'));
      resolve(result);
    };
    const form = new FormData();
    for (const [key,value] of Object.entries(fields)) form.append(key,value);
    form.append('file',file);
    xhr.send(form);
  });
}
