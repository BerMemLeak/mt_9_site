# Используем Node.js для сборки и запуска
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект в контейнер
COPY . .

# Сборка React-приложения
RUN npm run build

# Устанавливаем порт, на котором будет работать сервер
ENV PORT=8080

# Запуск приложения
CMD ["npm", "start"]
