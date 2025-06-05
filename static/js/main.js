// Загрузка автомобилей при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCars();
    loadFilters();
});

// Загрузка автомобилей с фильтрами
async function loadCars(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/cars?${queryParams}`);
        const cars = await response.json();
        
        const carsList = document.getElementById('carsList');
        carsList.innerHTML = '';
        
        if (cars.length === 0) {
            carsList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search" style="font-size: 3rem; color: #6c757d;"></i>
                    <h3 class="mt-3">Автомобили не найдены</h3>
                    <p class="text-muted">Попробуйте изменить параметры поиска</p>
                </div>
            `;
            return;
        }

        cars.forEach(car => {
            const carCard = createCarCard(car);
            carsList.appendChild(carCard);
        });
    } catch (error) {
        console.error('Error loading cars:', error);
        showAlert('Ошибка при загрузке автомобилей', 'danger');
    }
}

// Создание карточки автомобиля
function createCarCard(car) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    col.innerHTML = `
        <div class="card car-card h-100">
            <div class="card-body">
                <h5 class="card-title">${car.brand} ${car.car_model}</h5>
                <div class="price mb-3">${formatPrice(car.price)} ₽</div>
                <div class="specs">
                    <span class="spec-item">
                        <i class="bi bi-calendar3 me-1"></i>${car.year}
                    </span>
                    <span class="spec-item">
                        <i class="bi bi-speedometer2 me-1"></i>${formatMileage(car.mileage)}
                    </span>
                    <span class="spec-item">
                        <i class="bi bi-fuel-pump me-1"></i>${car.fuel_type}
                    </span>
                    <span class="spec-item">
                        <i class="bi bi-gear me-1"></i>${car.transmission}
                    </span>
                </div>
                <p class="description mt-3">${car.description || 'Описание отсутствует'}</p>
                <div class="action-buttons">
                    <button class="btn btn-outline-primary" onclick="editCar(${car.id})">
                        <i class="bi bi-pencil me-1"></i>Редактировать
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteCar(${car.id})">
                        <i class="bi bi-trash me-1"></i>Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

// Форматирование пробега
function formatMileage(mileage) {
    return new Intl.NumberFormat('ru-RU').format(mileage) + ' км';
}

// Загрузка фильтров
async function loadFilters() {
    try {
        const response = await fetch('/api/cars');
        const cars = await response.json();
        
        // Получаем уникальные значения для фильтров
        const brands = [...new Set(cars.map(car => car.brand))].sort();
        const models = [...new Set(cars.map(car => car.car_model))].sort();
        const fuelTypes = [...new Set(cars.map(car => car.fuel_type))].sort();
        const transmissions = [...new Set(cars.map(car => car.transmission))].sort();
        
        // Заполняем селекты
        fillSelect('brand', brands);
        fillSelect('model', models);
        fillSelect('fuelType', fuelTypes);
        fillSelect('transmission', transmissions);
        
        // Добавляем обработчики событий
        document.getElementById('brand').addEventListener('change', updateModels);
        document.getElementById('filterForm').addEventListener('submit', handleFilterSubmit);
    } catch (error) {
        console.error('Error loading filters:', error);
        showAlert('Ошибка при загрузке фильтров', 'danger');
    }
}

// Заполнение селекта опциями
function fillSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Все ${selectId === 'brand' ? 'марки' : 
        selectId === 'model' ? 'модели' : 
        selectId === 'fuelType' ? 'типы топлива' : 'трансмиссии'}</option>`;
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

// Обновление списка моделей при выборе марки
function updateModels() {
    const brand = document.getElementById('brand').value;
    const modelSelect = document.getElementById('model');
    
    if (!brand) {
        fillSelect('model', []);
        return;
    }
    
    fetch(`/api/cars?brand=${encodeURIComponent(brand)}`)
        .then(response => response.json())
        .then(cars => {
            const models = [...new Set(cars.map(car => car.car_model))].sort();
            fillSelect('model', models);
        })
        .catch(error => {
            console.error('Error updating models:', error);
            showAlert('Ошибка при обновлении списка моделей', 'danger');
        });
}

// Обработка отправки формы фильтров
function handleFilterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = {};
    
    for (const [key, value] of formData.entries()) {
        if (value) {
            filters[key] = value;
        }
    }
    
    loadCars(filters);
}

// Добавление автомобиля
async function addCar() {
    const form = document.getElementById('addCarForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const formData = new FormData(form);
    const car = {};
    
    for (const [key, value] of formData.entries()) {
        car[key] = value;
    }
    
    try {
        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(car)
        });
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            form.reset();
            form.classList.remove('was-validated');
            loadCars();
            showAlert('Автомобиль успешно добавлен', 'success');
        } else {
            throw new Error('Failed to add car');
        }
    } catch (error) {
        console.error('Error adding car:', error);
        showAlert('Ошибка при добавлении автомобиля', 'danger');
    }
}

// Редактирование автомобиля
async function editCar(id) {
    try {
        const response = await fetch(`/api/cars/${id}`);
        const car = await response.json();
        
        // Заполняем форму данными автомобиля
        const form = document.getElementById('addCarForm');
        form.brand.value = car.brand;
        form.model.value = car.car_model;
        form.year.value = car.year;
        form.price.value = car.price;
        form.mileage.value = car.mileage;
        form.color.value = car.color;
        form.engine_size.value = car.engine_size;
        form.transmission.value = car.transmission;
        form.fuel_type.value = car.fuel_type;
        form.description.value = car.description;
        
        // Изменяем заголовок и кнопку модального окна
        const modal = document.getElementById('addCarModal');
        modal.querySelector('.modal-title').innerHTML = '<i class="bi bi-pencil me-2"></i>Редактировать автомобиль';
        const submitButton = modal.querySelector('.modal-footer .btn-primary');
        submitButton.innerHTML = '<i class="bi bi-save me-2"></i>Сохранить';
        submitButton.onclick = () => updateCar(id);
        
        // Показываем модальное окно
        new bootstrap.Modal(modal).show();
    } catch (error) {
        console.error('Error loading car details:', error);
        showAlert('Ошибка при загрузке данных автомобиля', 'danger');
    }
}

// Обновление автомобиля
async function updateCar(id) {
    const form = document.getElementById('addCarForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const formData = new FormData(form);
    const car = {};
    
    for (const [key, value] of formData.entries()) {
        car[key] = value;
    }
    
    try {
        const response = await fetch(`/api/cars/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(car)
        });
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            form.reset();
            form.classList.remove('was-validated');
            loadCars();
            showAlert('Автомобиль успешно обновлен', 'success');
        } else {
            throw new Error('Failed to update car');
        }
    } catch (error) {
        console.error('Error updating car:', error);
        showAlert('Ошибка при обновлении автомобиля', 'danger');
    }
}

// Удаление автомобиля
async function deleteCar(id) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cars/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCars();
            showAlert('Автомобиль успешно удален', 'success');
        } else {
            throw new Error('Failed to delete car');
        }
    } catch (error) {
        console.error('Error deleting car:', error);
        showAlert('Ошибка при удалении автомобиля', 'danger');
    }
}

// Показ уведомления
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatTransmission(transmission) {
    const types = {
        'manual': 'Механика',
        'automatic': 'Автомат'
    };
    return types[transmission] || transmission;
}

function formatFuelType(fuelType) {
    const types = {
        'petrol': 'Бензин',
        'diesel': 'Дизель',
        'electric': 'Электро'
    };
    return types[fuelType] || fuelType;
}

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
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Ошибка при загрузке данных автомобиля:', error);
        alert('Произошла ошибка при загрузке данных автомобиля');
    }
}

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

function loadTransmissions() {
	fetch('/api/transmissions')
		.then(response => response.json())
		.then(data => {
			const transmissionSelect = document.getElementById('transmission');
			transmissionSelect.innerHTML = '<option value="">Все трансмиссии</option>';
			data.forEach(type => {
				transmissionSelect.innerHTML += `<option value="${type}">${type}</option>`;
			});
		})
		.catch(error => console.error('Error loading transmissions:', error));
} 