package models

import (
	"gorm.io/gorm"
)

type Car struct {
	gorm.Model
	Brand        string  `json:"brand"`
	CarModel     string  `json:"model"`
	Year         int     `json:"year"`
	Price        float64 `json:"price"`
	Mileage      int     `json:"mileage"`
	Color        string  `json:"color"`
	EngineSize   float64 `json:"engine_size"`
	Transmission string  `json:"transmission"`
	FuelType     string  `json:"fuel_type"`
	Description  string  `json:"description"`
	ImageURL     string  `json:"image_url"`
}
