import React from 'react';

const ScheduleTable = ({ theme }) => {
  const schedules = [
    {
      group: 'МТ9-11Б',
      file: '/assets/shcedule/mt9_11b.xlsx',
      updated: '29.08.2024'
    },
    {
      group: 'МТ9-31Б',
      file: '/assets/shcedule/mt9_31b.xlsx',
      updated: '29.08.2024'
    },
    {
      group: 'МТ9-51Б',
      file: '/assets/shcedule/mt9_51b.xlsx',
      updated: '29.08.2024'
    },
    {
      group: 'МТ9-71Б',
      file: '/assets/shcedule/mt9_71b.xlsx',
      updated: '29.08.2024'
    },
    {
      group: 'МТ9-11М',
      file: '/assets/shcedule/mt9_11m.xlsx',
      updated: '29.08.2024'
    },
    {
      group: 'МТ9-31М',
      file: '/assets/shcedule/mt9_31m.xlsx',
      updated: '29.08.2024'
    }
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 'medium', fontWeight: 'bold' }}>Расписание</h1>
      
      <table style={{ width: '100%', marginBottom: '4rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '1rem 0', textAlign: 'center' }}>Группы</th>
            <th style={{ padding: '1rem 0', textAlign: 'center' }}>Файлы</th>
            <th style={{ padding: '1rem 0', textAlign: 'center' }}>Дата обновления</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule, index) => (
            <tr key={index}>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>{schedule.group}</td>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                <a href={schedule.file} target="_blank" rel="noopener noreferrer">Скачать</a>
              </td>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>{schedule.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
