package api

import (
	"cars_catalog/config"
	"cars_catalog/models"
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

type VehicleListing struct {
	ID       int     `json:"id"`
	Make     string  `json:"make"`
	Model    string  `json:"model"`
	Year     int     `json:"year"`
	Price    float64 `json:"priceUnformatted"`
	Mileage  int     `json:"mileageUnformatted"`
	Color    string  `json:"displayColor"`
	VIN      string  `json:"vin"`
	ImageURL string  `json:"primaryPhotoUrl"`
}

type VinInfo struct {
	Engine struct {
		EngineSize float64 `json:"size"`
		FuelType   string  `json:"fuelType"`
	} `json:"engine"`
	Transmission struct {
		TransmissionType string `json:"transmissionType"`
	} `json:"transmission"`
}

type ListingsResponse struct {
	Count int              `json:"hitsCount"`
	Data  []VehicleListing `json:"records"`
}

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
	u, err := url.Parse(BaseURL)
	if err != nil {
		return nil, fmt.Errorf("URL parsing error: %v", err)
	}
	u.RawQuery = params.Encode()

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("request creation error: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request execution error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("API error: status %d, body read error: %v", resp.StatusCode, err)
		}
		return nil, fmt.Errorf("API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("response read error: %v", err)
	}

	return body, nil
}

func ImportVehiclesToDB() error {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v\n", err)
	}

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return fmt.Errorf("API_KEY is not set in .env file")
	}

	params := url.Values{}
	params.Add("page", "22")

	listings, err := fetchListings(apiKey, params)
	if err != nil {
		return fmt.Errorf("error fetching listings: %v", err)
	}

	for _, vehicle := range listings.Data {
		vinData, err := fetchVIN(apiKey, vehicle.VIN)
		if err != nil {
			log.Printf("Warning: Error getting VIN data for %s: %v\n", vehicle.VIN, err)
			continue
		}

		transmission := vinData.Transmission.TransmissionType
		if transmission == "" {
			transmission = "Не указано"
		}

		fuelType := vinData.Engine.FuelType
		if fuelType == "" {
			fuelType = "Не указано"
		}

		car := models.Car{
			Brand:        vehicle.Make,
			CarModel:     vehicle.Model,
			Year:         vehicle.Year,
			Price:        vehicle.Price,
			Mileage:      vehicle.Mileage,
			Color:        vehicle.Color,
			EngineSize:   vinData.Engine.EngineSize,
			Transmission: transmission,
			FuelType:     fuelType,
			Description:  fmt.Sprintf("VIN: %s", vehicle.VIN),
			ImageURL:     vehicle.ImageURL,
		}

		if err := config.DB.Create(&car).Error; err != nil {
			log.Printf("Warning: Failed to save car %s %s: %v\n", car.Brand, car.CarModel, err)
			continue
		}

		log.Printf("Successfully imported: %s %s (%d)\n", car.Brand, car.CarModel, car.Year)

		time.Sleep(100 * time.Millisecond)
	}

	return nil
}
