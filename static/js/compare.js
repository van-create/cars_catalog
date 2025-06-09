// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(price);
}

// Форматирование пробега
function formatMileage(mileage) {
    return new Intl.NumberFormat('ru-RU').format(mileage);
}

// Форматирование типа трансмиссии
function formatTransmission(transmission) {
    const types = {
        'manual': 'Механика',
        'automatic': 'Автомат'
    };
    return types[transmission] || transmission;
}

// Форматирование типа топлива
function formatFuelType(fuelType) {
    const types = {
        'petrol': 'Бензин',
        'diesel': 'Дизель',
        'electric': 'Электро'
    };
    return types[fuelType] || fuelType;
}

// Загрузка автомобилей для сравнения
async function loadCarsForCompare() {
    const urlParams = new URLSearchParams(window.location.search);
    const ids = urlParams.get('ids');
    
    if (!ids) {
        window.location.href = '/';
        return;
    }

    const carIds = ids.split(',');
    const cars = [];

    for (const id of carIds) {
        try {
            const response = await fetch(`/api/cars/${id}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке автомобиля');
            }
            const car = await response.json();
            cars.push(car);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при загрузке автомобилей для сравнения');
            return;
        }
    }

    updateCompareTable(cars);
}

// Обновление таблицы сравнения
function updateCompareTable(cars) {
    const tableBody = document.getElementById('compareTableBody');
    tableBody.innerHTML = '';

    // Обновляем заголовки
    for (let i = 0; i < cars.length; i++) {
        const header = document.getElementById(`car${i + 1}Header`);
        header.textContent = `${cars[i].brand} ${cars[i].model}`;
    }

    // Скрываем неиспользуемые колонки
    for (let i = cars.length; i < 3; i++) {
        const header = document.getElementById(`car${i + 1}Header`);
        header.parentElement.style.display = 'none';
    }

    // Добавляем строки сравнения
    const specs = [
        { name: 'Фото', key: 'image_url', type: 'image' },
        { name: 'Цена', key: 'price', type: 'price' },
        { name: 'Год выпуска', key: 'year', type: 'number' },
        { name: 'Пробег', key: 'mileage', type: 'mileage' },
        { name: 'Объем двигателя', key: 'engine_size', type: 'engine' },
        { name: 'Трансмиссия', key: 'transmission', type: 'transmission' },
        { name: 'Тип топлива', key: 'fuel_type', type: 'fuel' },
        { name: 'Цвет', key: 'color', type: 'text' },
        { name: 'Описание', key: 'description', type: 'text' }
    ];

    specs.forEach(spec => {
        const row = document.createElement('tr');
        
        // Заголовок характеристики
        const th = document.createElement('th');
        th.textContent = spec.name;
        row.appendChild(th);

        // Значения для каждого автомобиля
        cars.forEach(car => {
            const td = document.createElement('td');
            td.className = 'spec-value';

            switch (spec.type) {
                case 'image':
                    td.innerHTML = car[spec.key] ? 
                        `<img src="${car[spec.key]}" class="car-image" alt="${car.brand} ${car.model}" onerror="this.src='/static/images/no-image.jpg'">` :
                        `<img src="/static/images/no-image.jpg" class="car-image" alt="${car.brand} ${car.model}">`;
                    break;
                case 'price':
                    td.textContent = formatPrice(car[spec.key]);
                    break;
                case 'mileage':
                    td.textContent = formatMileage(car[spec.key]) + ' км';
                    break;
                case 'engine':
                    td.textContent = car[spec.key] + ' л';
                    break;
                case 'transmission':
                    td.textContent = formatTransmission(car[spec.key]);
                    break;
                case 'fuel':
                    td.textContent = formatFuelType(car[spec.key]);
                    break;
                default:
                    td.textContent = car[spec.key] || '-';
            }

            row.appendChild(td);
        });

        // Добавляем пустые ячейки для неиспользуемых колонок
        for (let i = cars.length; i < 3; i++) {
            const td = document.createElement('td');
            td.textContent = '-';
            row.appendChild(td);
        }

        tableBody.appendChild(row);
    });

    // Подсветка лучших значений
    highlightBestValues(cars);
}

// Подсветка лучших значений
function highlightBestValues(cars) {
    const rows = document.querySelectorAll('#compareTableBody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const values = Array.from(cells).map(cell => {
            const text = cell.textContent;
            if (text.includes('₽')) {
                return parseFloat(text.replace(/[^\d.-]/g, ''));
            } else if (text.includes('км')) {
                return parseFloat(text.replace(/[^\d.-]/g, ''));
            } else if (text.includes('л')) {
                return parseFloat(text.replace(/[^\d.-]/g, ''));
            }
            return null;
        }).filter(v => v !== null);

        if (values.length > 0) {
            const isPrice = cells[0].textContent.includes('₽');
            const isMileage = cells[0].textContent.includes('км');
            
            if (isPrice) {
                // Для цены лучшим является минимальное значение
                const minValue = Math.min(...values);
                cells.forEach((cell, index) => {
                    if (parseFloat(cell.textContent.replace(/[^\d.-]/g, '')) === minValue) {
                        cell.classList.add('highlight');
                    }
                });
            } else if (isMileage) {
                // Для пробега лучшим является минимальное значение
                const minValue = Math.min(...values);
                cells.forEach((cell, index) => {
                    if (parseFloat(cell.textContent.replace(/[^\d.-]/g, '')) === minValue) {
                        cell.classList.add('highlight');
                    }
                });
            } else {
                // Для остальных числовых значений лучшим является максимальное значение
                const maxValue = Math.max(...values);
                cells.forEach((cell, index) => {
                    if (parseFloat(cell.textContent.replace(/[^\d.-]/g, '')) === maxValue) {
                        cell.classList.add('highlight');
                    }
                });
            }
        }
    });
}

// Загружаем автомобили при загрузке страницы
document.addEventListener('DOMContentLoaded', loadCarsForCompare); 