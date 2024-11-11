import React, { useState } from 'react';
import disciplinesData from '../../database/disciplinesData';
import styles from './Disciplines.css'; // Импортируем CSS-модуль

const Discipline = ({ title, methods, theme }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.discipline} ${styles[theme]}`}>
      <h2 className={styles.toggle} onClick={() => setIsOpen(!isOpen)}>
        {title}
      </h2>
      {isOpen && (
        <div>
          {methods.map((method, index) => (
            <p key={index}>
              <a className={styles.methodContainer} href={method.link}>
                <img className={styles.transform} src="/assets/images/method-book.png" alt="" />
                <span>{method.name}</span>
              </a>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const Disciplines = ({ theme }) => {
  return (
    <div className={`${styles.disciplinesContainer} ${styles[theme]}`}>
      <h1>Магистрам</h1>
      <div id="magisters">
        {disciplinesData.map((discipline, index) => (
          <Discipline
            key={index}
            title={discipline.title}
            methods={discipline.methods}
            theme={theme}
          />
        ))}
      </div>

      <h1>Бакалаврам</h1>
      <div id="common">
        {disciplinesData.map((discipline, index) => (
          <Discipline
            key={index}
            title={discipline.title}
            methods={discipline.methods}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
};

export default Disciplines;
