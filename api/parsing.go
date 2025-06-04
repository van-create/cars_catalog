package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/joho/godotenv"
)

const (
	apiBaseURL = "https://auto.dev/api/listings"
	vinBaseURL = "https://auto.dev/api/vin"
)

// VehicleListing представляет структуру данных для одной записи автомобиля
type VehicleListing struct {
	ID      int     `json:"id"`
	Make    string  `json:"make"`
	Model   string  `json:"model"`
	Year    int     `json:"year"`
	Price   float64 `json:"priceUnformatted"`
	Mileage int     `json:"mileageUnformatted"`
	Color   string  `json:"displayColor"`
	VIN     string  `json:"vin"`
	VINData VinInfo
}

// VinInfo представляет структуру данных для VIN-информации
type VinInfo struct {
	Engine struct {
		EngineSize float64 `json:"size"`
		FuelType   string  `json:"fuelType"`
	} `json:"engine"`
	Transmission struct {
		TransmissionType string `json:"transmissionType"`
	} `json:"transmission"`
}

// ListingsResponse представляет структуру ответа API
type ListingsResponse struct {
	Count int              `json:"hitsCount"`
	Data  []VehicleListing `json:"records"`
}

// fetchListings выполняет запрос к API auto.dev с указанными параметрами
func fetchListings(apiKey string, params url.Values) (*ListingsResponse, error) {
	body, err := createRequest(apiBaseURL, apiKey, params)
	if err != nil {
		return nil, fmt.Errorf("API request error: %v", err)
	}

	var listings ListingsResponse
	if err := json.Unmarshal(body, &listings); err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	return &listings, nil
}

func fetchVIN(apiKey string, vin string) (*VinInfo, error) {
	vinURL := fmt.Sprintf("%s/%s", vinBaseURL, vin)
	body, err := createRequest(vinURL, apiKey, url.Values{})
	if err != nil {
		return nil, fmt.Errorf("VIN request error: %v", err)
	}

	var vinInfo VinInfo
	if err := json.Unmarshal(body, &vinInfo); err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	return &vinInfo, nil
}

func createRequest(BaseURL string, apiKey string, params url.Values) ([]byte, error) {
	// Формируем URL с параметрами
	u, err := url.Parse(BaseURL)
	if err != nil {
		return nil, fmt.Errorf("URL parsing error: %v", err)
	}
	u.RawQuery = params.Encode()

	// Создаем HTTP-запрос
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("request creation error: %v", err)
	}

	// Добавляем API-ключ в заголовок Authorization
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Выполняем запрос
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request execution error: %v", err)
	}
	defer resp.Body.Close()

	// Проверяем статус ответа
	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("API error: status %d, body read error: %v", resp.StatusCode, err)
		}
		return nil, fmt.Errorf("API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	// Читаем и парсим тело ответа
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("response read error: %v", err)
	}

	return body, nil
}

func getCompleteVehicles() {
	// Загружаем переменные окружения из .env файла
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v\n", err)
	}

	// Получаем API ключ из переменных окружения
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY is not set in .env file")
	}

	// Настраиваем параметры запроса
	params := url.Values{}
	params.Add("page", "22") // Номер страницы

	// Выполняем запрос к API
	listings, err := fetchListings(apiKey, params)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Заполняем VINData для каждого автомобиля
	for i := range listings.Data {
		vinData, err := fetchVIN(apiKey, listings.Data[i].VIN)
		if err != nil {
			fmt.Printf("Error getting VIN data for %s: %v\n", listings.Data[i].VIN, err)
			continue
		}
		listings.Data[i].VINData = *vinData // Разыменовываем указатель
		// Делаем небольшую паузу между запросами чтобы не перегружать API
		time.Sleep(100 * time.Millisecond)
	}

	// Выводим результаты
	fmt.Printf("Найдено %d объявлений:\n", listings.Count)
	for _, vehicle := range listings.Data {
		fmt.Printf("\nАвтомобиль: %s %s %d\n", vehicle.Make, vehicle.Model, vehicle.Year)
		fmt.Printf("VIN: %s\n", vehicle.VIN)
		fmt.Printf("Цена: $%.2f\n", vehicle.Price)
		fmt.Printf("Пробег: %d миль\n", vehicle.Mileage)
		fmt.Printf("Цвет: %s\n", vehicle.Color)
		fmt.Printf("Трансмиссия: %s\n", vehicle.VINData.Transmission.TransmissionType)
	}
}
