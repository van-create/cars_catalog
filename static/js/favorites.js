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

// Создание карточки автомобиля
function createCarCard(car) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.setAttribute('data-car-id', car.ID || car.id);
    
    col.innerHTML = `
        <div class="card car-card" style="cursor: pointer;" onclick="showCarDetails(${car.ID || car.id})">
            ${car.image_url ? 
                `<img src="${car.image_url}" class="card-img-top" alt="${car.brand} ${car.model}" onerror="this.src='/static/images/no-image.jpg'">` :
                `<img src="/static/images/no-image.jpg" class="card-img-top" alt="${car.brand} ${car.model}">`
            }
            <div class="card-body">
                <h5 class="card-title">${car.brand} ${car.model}</h5>
                <p class="car-price">${formatPrice(car.price)}</p>
                <div class="car-specs">
                    <p><i class="bi bi-calendar"></i> ${car.year} год</p>
                    <p><i class="bi bi-speedometer2"></i> ${formatMileage(car.mileage)} км</p>
                    <p><i class="bi bi-gear"></i> ${formatTransmission(car.transmission)}</p>
                    <p><i class="bi bi-fuel-pump-fill"></i> ${formatFuelType(car.fuel_type)}</p>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); removeFromFavorites('${car.ID || car.id}')">
                        <i class="bi bi-heart-fill"></i> Удалить из избранного
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Загрузка автомобилей
async function loadCars(queryParams = '') {
    try {
        const response = await fetch(`/api/favorites?${queryParams}`);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке избранных автомобилей');
        }
        const cars = await response.json();
        const carsList = document.getElementById('carsList');
        carsList.innerHTML = '';
        cars.forEach(car => {
            carsList.appendChild(createCarCard(car));
        });
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Удаление из избранного
async function removeFromFavorites(id) {
    try {
        const response = await fetch(`/api/favorites/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при удалении из избранного');
        }

        const carCard = document.querySelector(`[data-car-id="${id}"]`);
        if (carCard) {
            carCard.remove();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Показ деталей автомобиля
async function showCarDetails(id) {
    try {
        const response = await fetch(`/api/cars/${id}`);
        const car = await response.json();
        
        const modal = document.getElementById('carDetailsModal');
        modal.querySelector('.car-brand-model').textContent = `${car.brand} ${car.model}`;
        modal.querySelector('.car-price').textContent = formatPrice(car.price);
        modal.querySelector('.car-year').textContent = `${car.year} год`;
        modal.querySelector('.car-mileage').textContent = `${formatMileage(car.mileage)} км`;
        modal.querySelector('.car-transmission').textContent = formatTransmission(car.transmission);
        modal.querySelector('.car-fuel-type').textContent = formatFuelType(car.fuel_type);
        modal.querySelector('.car-color').textContent = car.color;
        modal.querySelector('.car-engine-size').textContent = `${car.engine_size} л`;
        modal.querySelector('.car-description').textContent = car.description || 'Описание отсутствует';
        
        // Обновляем изображение
        const carImage = modal.querySelector('.car-image');
        if (car.image_url) {
            carImage.src = car.image_url;
            carImage.onerror = function() {
                this.src = '/static/images/no-image.jpg';
            };
        } else {
            carImage.src = '/static/images/no-image.jpg';
        }
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Ошибка при загрузке данных автомобиля:', error);
        alert('Произошла ошибка при загрузке данных автомобиля');
    }
}

// Загрузка типов топлива
function loadFuelTypes() {
    fetch('/api/fuel-types')
        .then(response => response.json())
        .then(data => {
            const fuelTypeSelect = document.getElementById('fuelType');
            fuelTypeSelect.innerHTML = '<option value="">Все типы топлива</option>';
            data.forEach(type => {
                fuelTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
            });
        })
        .catch(error => console.error('Error loading fuel types:', error));
}

// Загрузка типов трансмиссии
function loadTransmissions() {
    fetch('/api/transmissions')
        .then(response => response.json())
        .then(data => {
            const transmissionSelect = document.getElementById('transmission');
            transmissionSelect.innerHTML = '<option value="">Все типы трансмиссии</option>';
            data.forEach(type => {
                transmissionSelect.innerHTML += `<option value="${type}">${type}</option>`;
            });
        })
        .catch(error => console.error('Error loading transmissions:', error));
}

// Обработка формы фильтрации
document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const params = new URLSearchParams();
    
    for (let [key, value] of formData.entries()) {
        if (value) {
            params.append(key, value);
        }
    }
    
    loadCars(params.toString());
});

// Обработка кнопок сортировки
document.querySelectorAll('.sort-btn').forEach(button => {
    button.addEventListener('click', function() {
        const sortBy = this.dataset.sort;
        const currentOrder = this.dataset.order;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        
        // Обновляем иконки и порядок сортировки
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.dataset.order = 'asc';
            btn.innerHTML = btn.innerHTML.replace('↓', '↑').replace('↑', '↑');
        });
        
        this.dataset.order = newOrder;
        this.innerHTML = this.innerHTML.replace('↑', '↓').replace('↓', '↓');
        
        // Загружаем отсортированные данные
        const params = new URLSearchParams();
        params.append('sort_by', sortBy);
        params.append('sort_order', newOrder);
        
        loadCars(params.toString());
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCars();
    loadFuelTypes();
    loadTransmissions();
}); 