package api

import (
	"cars_catalog/config"
	"cars_catalog/models"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
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
	ID           string  `json:"id"`
	Make         string  `json:"make"`
	Model        string  `json:"model"`
	Year         int     `json:"year"`
	Price        float64 `json:"price"`
	Mileage      int     `json:"mileage"`
	Color        string  `json:"color"`
	EngineSize   float64 `json:"engineSize"`
	Transmission string  `json:"transmission"`
	FuelType     string  `json:"fuelType"`
	Description  string  `json:"description"`
	Vin          string  `json:"vin"`
}

// VinInfo представляет структуру данных для VIN-информации
type VinInfo struct {
	Make         string  `json:"make"`
	Model        string  `json:"model"`
	Year         int     `json:"year"`
	EngineSize   float64 `json:"engineSize"`
	Transmission string  `json:"transmission"`
	FuelType     string  `json:"fuelType"`
}

// ListingsResponse представляет структуру ответа API
type ListingsResponse struct {
	Listings []VehicleListing `json:"listings"`
}

// fetchListings выполняет запрос к API auto.dev с указанными параметрами
func fetchListings(apiKey string, params map[string]string) (*ListingsResponse, error) {
	url := apiBaseURL
	if len(params) > 0 {
		query := ""
		for key, value := range params {
			if query != "" {
				query += "&"
			}
			query += fmt.Sprintf("%s=%s", key, value)
		}
		url += "?" + query
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned non-200 status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	var response ListingsResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &response, nil
}

func fetchVinInfo(apiKey, vin string) (*VinInfo, error) {
	url := fmt.Sprintf("%s/%s", vinBaseURL, vin)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned non-200 status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	var vinInfo VinInfo
	if err := json.Unmarshal(body, &vinInfo); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &vinInfo, nil
}

// ImportVehiclesToDB получает данные с внешнего API и сохраняет их в локальную БД
func ImportVehiclesToDB() error {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return fmt.Errorf("API_KEY not found in environment variables")
	}

	params := make(map[string]string)
	params["page"] = "22"

	response, err := fetchListings(apiKey, params)
	if err != nil {
		return fmt.Errorf("error fetching listings: %v", err)
	}

	for _, listing := range response.Listings {
		car := models.Car{
			Brand:        listing.Make,
			CarModel:     listing.Model,
			Year:         listing.Year,
			Price:        listing.Price,
			Mileage:      listing.Mileage,
			Color:        listing.Color,
			EngineSize:   listing.EngineSize,
			Transmission: listing.Transmission,
			FuelType:     listing.FuelType,
			Description:  listing.Description,
		}

		if err := config.DB.Create(&car).Error; err != nil {
			log.Printf("Error saving car to database: %v", err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	return nil
}
