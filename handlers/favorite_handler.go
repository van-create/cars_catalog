package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"cars_catalog/config"
	"cars_catalog/models"

	"github.com/gin-gonic/gin"
)

func parseUint(s string) uint64 {
	u, _ := strconv.ParseUint(s, 10, 64)
	return u
}

func GetFavorites(c *gin.Context) {
	var filter CarFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Константы для расчета рейтинга
	const (
		k = 1000000.0 // коэффициент масштабирования
		m = 100000.0  // нормализационный коэффициент для пробега
	)

	query := config.DB.Model(&models.Favorite{}).
		Joins("JOIN cars ON favorites.car_id = cars.id").
		Select("cars.*, CASE WHEN cars.price > 0 THEN ? / (cars.price * (1 + cars.mileage / ?)) ELSE 0 END as rating", k, m)

	if filter.Brand != "" {
		query = query.Where("cars.brand ILIKE ?", "%"+filter.Brand+"%")
	}
	if filter.Model != "" {
		query = query.Where("cars.car_model ILIKE ?", "%"+filter.Model+"%")
	}
	if filter.MinPrice > 0 {
		query = query.Where("cars.price >= ?", filter.MinPrice)
	}
	if filter.MaxPrice > 0 {
		query = query.Where("cars.price <= ?", filter.MaxPrice)
	}
	if filter.MinYear > 0 {
		query = query.Where("cars.year >= ?", filter.MinYear)
	}
	if filter.MaxYear > 0 {
		query = query.Where("cars.year <= ?", filter.MaxYear)
	}
	if filter.MinMileage > 0 {
		query = query.Where("cars.mileage >= ?", filter.MinMileage)
	}
	if filter.MaxMileage > 0 {
		query = query.Where("cars.mileage <= ?", filter.MaxMileage)
	}
	if filter.MinEngineSize > 0 {
		query = query.Where("cars.engine_size >= ?", filter.MinEngineSize)
	}
	if filter.MaxEngineSize > 0 {
		query = query.Where("cars.engine_size <= ?", filter.MaxEngineSize)
	}
	if filter.Transmission != "" {
		query = query.Where("cars.transmission = ?", filter.Transmission)
	}
	if filter.FuelType != "" {
		query = query.Where("cars.fuel_type = ?", filter.FuelType)
	}

	// Сортировка
	if filter.SortBy != "" {
		order := "ASC"
		if filter.SortOrder == "desc" {
			order = "DESC"
		}

		if filter.SortBy == "rating" {
			ratingExpr := fmt.Sprintf("CASE WHEN cars.price > 0 THEN %f / (cars.price * (1 + cars.mileage / %f)) ELSE 0 END %s", k, m, order)
			query = query.Order(ratingExpr)
		} else {
			query = query.Order("cars." + filter.SortBy + " " + order)
		}
	} else {
		query = query.Order("cars.id DESC")
	}

	var cars []models.Car
	if err := query.Find(&cars).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cars)
}

func AddToFavorites(c *gin.Context) {
	carID := c.Param("id")

	favorite := models.Favorite{
		CarID: uint(parseUint(carID)),
	}

	if err := config.DB.Create(&favorite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Автомобиль добавлен в избранное"})
}

func RemoveFromFavorites(c *gin.Context) {
	carID := c.Param("id")

	if err := config.DB.Where("car_id = ?", carID).Delete(&models.Favorite{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Автомобиль удален из избранного"})
}

func IsFavorite(c *gin.Context) {
	carID := c.Param("id")

	var count int64
	config.DB.Model(&models.Favorite{}).Where("car_id = ?", carID).Count(&count)

	c.JSON(http.StatusOK, gin.H{"is_favorite": count > 0})
}
