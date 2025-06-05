async function loadCars(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/cars?${queryParams}`);
        const cars = await response.json();
        
        const carsList = document.getElementById('carsList');
        carsList.innerHTML = '';

        cars.forEach(car => {
            const carCard = createCarCard(car);
            carsList.appendChild(carCard);
        });
    } catch (error) {
        console.error('Ошибка при загрузке автомобилей:', error);
        alert('Произошла ошибка при загрузке автомобилей');
    }
}

function createCarCard(car) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    const carId = car.ID || car.id;
    
    col.innerHTML = `
        <div class="card car-card" style="cursor: pointer;" onclick="showCarDetails(${carId})">
            <div class="card-body">
                <h5 class="card-title">${car.brand} ${car.model}</h5>
                <p class="car-price">${formatPrice(car.price)}</p>
                <div class="car-specs">
                    <p><i class="bi bi-calendar"></i> ${car.year} год</p>
                    <p><i class="bi bi-speedometer2"></i> ${formatMileage(car.mileage)} км</p>
                    <p><i class="bi bi-gear"></i> ${formatTransmission(car.transmission)}</p>
                    <p><i class="bi bi-fuel-pump"></i> ${formatFuelType(car.fuel_type)}</p>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="event.stopPropagation(); editCar('${carId}')">
                        Редактировать
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteCar('${carId}')">
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

async function addCar() {
    const form = document.getElementById('addCarForm');
    const formData = new FormData(form);
    const carData = Object.fromEntries(formData.entries());
    carData.year = Number(carData.year);
    carData.price = Number(carData.price);
    carData.mileage = Number(carData.mileage);
    carData.engine_size = Number(carData.engine_size);

    try {
        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carData),
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            form.reset();
            loadCars();
        } else {
            throw new Error('Ошибка при добавлении автомобиля');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при добавлении автомобиля');
    }
}

async function deleteCar(id) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
        return;
    }

    try {
        const response = await fetch(`/api/cars/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadCars();
        } else {
            throw new Error('Ошибка при удалении автомобиля');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при удалении автомобиля');
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatMileage(mileage) {
    return new Intl.NumberFormat('ru-RU').format(mileage);
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

document.getElementById('filterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = Object.fromEntries(formData.entries());
    loadCars(filters);
});

document.addEventListener('DOMContentLoaded', () => {
    loadCars();
});

async function editCar(id) {
    try {
        const response = await fetch(`/api/cars/${id}`);
        const car = await response.json();
        
        const form = document.getElementById('editCarForm');
        if (!form) {
            return;
        }
        
        form.brand.value = car.brand;
        form.model.value = car.model;
        form.year.value = car.year;
        form.price.value = car.price;
        form.mileage.value = car.mileage;
        form.color.value = car.color;
        form.engine_size.value = car.engine_size;
        form.transmission.value = car.transmission;
        form.fuel_type.value = car.fuel_type;
        form.description.value = car.description;
        
        form.dataset.carId = car.ID;
        
        const modal = new bootstrap.Modal(document.getElementById('editCarModal'));
        modal.show();
    } catch (error) {
        console.error('Ошибка при загрузке данных автомобиля:', error);
        alert('Произошла ошибка при загрузке данных автомобиля');
    }
}

async function saveCarChanges() {
    const form = document.getElementById('editCarForm');
    const carId = form.dataset.carId;
    const formData = new FormData(form);
    const carData = Object.fromEntries(formData.entries());
    
    carData.year = Number(carData.year);
    carData.price = Number(carData.price);
    carData.mileage = Number(carData.mileage);
    carData.engine_size = Number(carData.engine_size);

    try {
        const response = await fetch(`/api/cars/${carId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carData),
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCarModal'));
            modal.hide();
            loadCars();
        } else {
            throw new Error('Ошибка при обновлении автомобиля');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при обновлении автомобиля');
    }
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