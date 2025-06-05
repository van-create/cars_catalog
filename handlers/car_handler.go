package handlers

import (
	"net/http"

	"cars_catalog/config"
	"cars_catalog/models"

	"github.com/gin-gonic/gin"
)

type CarFilter struct {
	Brand        string  `form:"brand"`
	MinPrice     float64 `form:"min_price"`
	MaxPrice     float64 `form:"max_price"`
	MinYear      int     `form:"min_year"`
	MaxYear      int     `form:"max_year"`
	Transmission string  `form:"transmission"`
	FuelType     string  `form:"fuel_type"`
}

func GetCars(c *gin.Context) {
	var filter CarFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := config.DB.Model(&models.Car{})

	if filter.Brand != "" {
		query = query.Where("brand ILIKE ?", "%"+filter.Brand+"%")
	}
	if filter.MinPrice > 0 {
		query = query.Where("price >= ?", filter.MinPrice)
	}
	if filter.MaxPrice > 0 {
		query = query.Where("price <= ?", filter.MaxPrice)
	}
	if filter.MinYear > 0 {
		query = query.Where("year >= ?", filter.MinYear)
	}
	if filter.MaxYear > 0 {
		query = query.Where("year <= ?", filter.MaxYear)
	}
	if filter.Transmission != "" {
		query = query.Where("transmission = ?", filter.Transmission)
	}
	if filter.FuelType != "" {
		query = query.Where("fuel_type = ?", filter.FuelType)
	}

	var cars []models.Car
	if err := query.Find(&cars).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cars)
}

func GetCar(c *gin.Context) {
	id := c.Param("id")
	var car models.Car

	if err := config.DB.First(&car, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Car not found"})
		return
	}

	c.JSON(http.StatusOK, car)
}

func CreateCar(c *gin.Context) {
	var car models.Car
	if err := c.ShouldBindJSON(&car); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&car).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, car)
}

func UpdateCar(c *gin.Context) {
	id := c.Param("id")
	var car models.Car

	if err := config.DB.First(&car, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Car not found"})
		return
	}

	if err := c.ShouldBindJSON(&car); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Save(&car).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, car)
}

func DeleteCar(c *gin.Context) {
	id := c.Param("id")
	var car models.Car

	if err := config.DB.First(&car, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Car not found"})
		return
	}

	if err := config.DB.Delete(&car).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Car deleted successfully"})
}

func ClearDB(c *gin.Context) {
	if err := config.DB.Exec("DELETE FROM cars").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Database cleared successfully"})
}
