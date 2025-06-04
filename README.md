# Каталог автомобилей

Веб-приложение для управления каталогом автомобилей, разработанное на Go с использованием Gin framework и PostgreSQL.

## Функциональность

- 📋 Просмотр списка автомобилей
- 🔍 Фильтрация по различным параметрам
- ➕ Добавление новых автомобилей
- ✏️ Редактирование существующих автомобилей
- 🗑️ Удаление автомобилей
- 📱 Адаптивный дизайн

## Технологии

- **Backend:**
  - Go 1.24
  - Gin Web Framework
  - GORM (ORM для работы с базой данных)
  - PostgreSQL

- **Frontend:**
  - HTML5
  - CSS3 (Bootstrap 5)
  - JavaScript (Vanilla)
  - Bootstrap Icons

## Требования

- Go 1.24 или выше
- PostgreSQL
- Postgres.app (для macOS) или другой PostgreSQL клиент

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/van-create/cars_catalog.git
cd cars_catalog
```

2. Установите зависимости:
```bash
go mod download
```

3. Создайте файл `.env` в корне проекта:
```env
# Настройки базы данных
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=cars_catalog
DB_PORT=5432

# Настройки сервера
PORT=8080
ENV=development

# Настройка API
API_KEY=your_api_key
```

4. Создайте базу данных:
```sql
CREATE DATABASE cars_catalog;
```

## Запуск

1. Запустите сервер:
```bash
go run main.go
```

2. Откройте браузер и перейдите по адресу:
```
http://localhost:8080
```

## Структура проекта

```
cars_catalog/
├── config/             # Конфигурация приложения
│   └── database.go     # Настройки базы данных
├── handlers/           # HTTP обработчики
│   └── car_handler.go  # Обработчики для работы с автомобилями
├── models/             # Модели данных
│   └── car.go         # Модель автомобиля
├── static/            # Статические файлы
│   ├── css/          # Стили
│   ├── js/           # JavaScript файлы
│   └── index.html    # Главная страница
├── .env              # Конфигурация окружения
├── .gitignore       # Исключения для Git
├── go.mod           # Зависимости Go
├── go.sum           # Контрольные суммы зависимостей
├── main.go          # Точка входа приложения
└── README.md        # Документация
```

## API Endpoints

### Автомобили

- `GET /api/cars` - Получить список автомобилей
- `GET /api/cars/:id` - Получить автомобиль по ID
- `POST /api/cars` - Создать новый автомобиль
- `PUT /api/cars/:id` - Обновить автомобиль
- `DELETE /api/cars/:id` - Удалить автомобиль

### Параметры фильтрации

- `brand` - Марка автомобиля
- `min_price` - Минимальная цена
- `max_price` - Максимальная цена
- `min_year` - Минимальный год выпуска
- `max_year` - Максимальный год выпуска
- `transmission` - Тип трансмиссии (manual/automatic)
- `fuel_type` - Тип топлива (petrol/diesel/electric)

## Лицензия

MIT License

## Авторы

Елисеев Иван - [GitHub](https://github.com/van-create)
Скляр Александр - [GitHub](https://github.com/your-username)
Дыбнова Ирина - [GitHub](https://github.com/CrazyCucumber1337)