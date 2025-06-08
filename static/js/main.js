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
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="event.stopPropagation(); editCar('${car.ID || car.id}')">
                        Редактировать
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteCar('${car.ID || car.id}')">
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

    try {
        const response = await fetch('/api/cars', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при добавлении автомобиля');
        }

        const car = await response.json();
        const carsList = document.getElementById('carsList');
        carsList.appendChild(createCarCard(car));

        const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
        modal.hide();
        form.reset();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

async function deleteCar(id) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
        return;
    }

    try {
        const response = await fetch(`/api/cars/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при удалении автомобиля');
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
    loadFuelTypes();
    loadTransmissions();
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
        
        // Показываем текущее изображение, если оно есть
        const currentImage = form.querySelector('.current-image');
        if (car.image_url) {
            currentImage.src = car.image_url;
            currentImage.style.display = 'block';
        } else {
            currentImage.style.display = 'none';
        }
        
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
    const formData = new FormData(form);
    const carId = form.dataset.carId;

    try {
        const response = await fetch(`/api/cars/${carId}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при обновлении автомобиля');
        }

        const updatedCar = await response.json();
        const carCard = document.querySelector(`[data-car-id="${carId}"]`);
        if (carCard) {
            const newCard = createCarCard(updatedCar);
            carCard.replaceWith(newCard);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('editCarModal'));
        modal.hide();
        form.reset();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
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