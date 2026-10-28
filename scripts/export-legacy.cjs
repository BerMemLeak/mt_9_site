// One-time reproducible migration: render existing JSX content into editable HTML.
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const {execFileSync} = require('child_process');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const original = require.extensions['.js'];
function compile(module, filename) {
  if (!filename.startsWith(path.join(root, 'src'))) return original(module, filename);
  const relative = path.relative(root,filename).replaceAll(path.sep,'/');
  const source = execFileSync('git',['show',`${process.env.LEGACY_REF || '5f9d57fa86fe20ea1b1effb6b938eba9f6ee8e73'}:${relative}`],{cwd:root,encoding:'utf8'});
  const output = babel.transformSync(source, {filename,babelrc: false, configFile: false,
    presets: [require.resolve('@babel/preset-react')],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]});
  module._compile('const React = require("react");\n' + output.code.replace(/const React = require\("react"\);/g, ''), filename);
}
require.extensions['.js'] = compile;
require.extensions['.jsx'] = compile;
require.extensions['.css'] = () => {};
for (const ext of ['.png', '.jpg', '.otf']) {
  require.extensions[ext] = (module, filename) => {
    const relative = path.relative(path.join(root, 'src'), filename);
    const target = path.join(root, 'public/legacy', relative);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(filename, target);
    module.exports = '/legacy/' + relative.replaceAll(path.sep, '/');
  };
}
function plain(value) {
  if (React.isValidElement(value)) return renderToStaticMarkup(value);
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,plain(v)]));
  return value;
}
const get = (file, key='default') => plain(require(path.join(root, 'src', file))[key]);
const pages = [['home','Главная','Home/Home'], ['about','История','About/About'],
  ['contacts','Контакты','Contacts/Contacts'], ['stepInFuture','Шаг в будущее','StepInFuture/StepInFuture']]
  .map(([id,title,file]) => {
    const Component = require(path.join(root,'src/pages',file)).default;
    let element = React.createElement(Component,{theme:'light'});
    if (id==='home') {
      const home = Component();
      // Teachers and courses stay live collections, not frozen copies in HTML.
      const children=React.Children.toArray(home.props.children).filter(child=>
        typeof child.type !== 'function' || child.type.name !== 'Marquee')
        .filter(child=>child.props.className !== 'course-title');
      element=React.cloneElement(home,{},children);
    }
    return {id,title,body:renderToStaticMarkup(element),_status:'published'};
  });
const seed = {
  announcements:get('database/announcementsData'), news:get('database/news_data','newsData'),
  teachers:get('database/teachersData','teachers'), cases:get('database/cases'),
  education:[{id:'education',...get('database/educationData','educationData')}],
  disciplines:get('database/disciplinesData'), schedules:get('database/schedules','schedules'),
  documents:get('database/documentsData','documentsData'), pages,
  courses:get('database/dop_curses','subjects').map((title,index)=>({id:`course-${index}`,title}))
};
for (const [name, records] of Object.entries(seed)) records.forEach((record,index)=>{
  record.id = String(record.id || `${name}-${index + 1}`);
  record._status = 'published';
  if (['announcements','news','cases'].includes(name)) record.attachments = [];
  if (record.link && typeof record.link === 'object') record.link.text = 'Подать заявку';
});
fs.writeFileSync(path.join(root,'backend/seed.json'),JSON.stringify(seed,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(seed).map(([name,rows])=>[name,rows.length])));
