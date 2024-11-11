import React from 'react';
import './ScheduleTable.css'; // Подключаем обновленные стили
import { schedules } from '../../database/schedules';
const ScheduleTable = ({ theme }) => {


  return (
    <div className="schedule-table-wrapper">
      <div className={`schedule-container ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
        <h1 className="schedule-title">Расписание</h1>
        
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Группы</th>
              <th>Файлы</th>
              <th>Дата обновления</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule, index) => (
              <tr key={index}>
                <td>{schedule.group}</td>
                <td>
                  <a href={schedule.file} target="_blank" rel="noopener noreferrer">Скачать</a>
                </td>
                <td>{schedule.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
