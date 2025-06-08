package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"cars_catalog/config"
	"cars_catalog/models"

	"github.com/gin-gonic/gin"
)

type CarFilter struct {
	Brand         string  `form:"brand"`
	Model         string  `form:"model"`
	MinPrice      float64 `form:"min_price"`
	MaxPrice      float64 `form:"max_price"`
	MinYear       int     `form:"min_year"`
	MaxYear       int     `form:"max_year"`
	MinMileage    int     `form:"min_mileage"`
	MaxMileage    int     `form:"max_mileage"`
	MinEngineSize float64 `form:"min_engine_size"`
	MaxEngineSize float64 `form:"max_engine_size"`
	Transmission  string  `form:"transmission"`
	FuelType      string  `form:"fuel_type"`
	SortBy        string  `form:"sort_by"`
	SortOrder     string  `form:"sort_order"`
}

func GetCars(c *gin.Context) {
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

	query := config.DB.Model(&models.Car{}).
		Select("*, CASE WHEN price > 0 THEN ? / (price * (1 + mileage / ?)) ELSE 0 END as rating", k, m)

	if filter.Brand != "" {
		query = query.Where("brand ILIKE ?", "%"+filter.Brand+"%")
	}
	if filter.Model != "" {
		query = query.Where("car_model ILIKE ?", "%"+filter.Model+"%")
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
	if filter.MinMileage > 0 {
		query = query.Where("mileage >= ?", filter.MinMileage)
	}
	if filter.MaxMileage > 0 {
		query = query.Where("mileage <= ?", filter.MaxMileage)
	}
	if filter.MinEngineSize > 0 {
		query = query.Where("engine_size >= ?", filter.MinEngineSize)
	}
	if filter.MaxEngineSize > 0 {
		query = query.Where("engine_size <= ?", filter.MaxEngineSize)
	}
	if filter.Transmission != "" {
		query = query.Where("transmission = ?", filter.Transmission)
	}
	if filter.FuelType != "" {
		query = query.Where("fuel_type = ?", filter.FuelType)
	}

	// Добавляем сортировку
	if filter.SortBy != "" {
		order := "ASC"
		if filter.SortOrder == "desc" {
			order = "DESC"
		}

		switch filter.SortBy {
		case "price":
			query = query.Order("price " + order)
		case "year":
			query = query.Order("year " + order)
		case "mileage":
			query = query.Order("mileage " + order)
		case "created_at":
			query = query.Order("created_at " + order)
		case "rating":
			query = query.Order("rating " + order)
		}
	} else {
		// Сортировка по умолчанию - старые записи первыми
		query = query.Order("id ASC")
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

func uploadImage(c *gin.Context) (string, error) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		return "", err
	}
	defer file.Close()

	// Создаем директорию для изображений, если она не существует
	uploadDir := "static/uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", err
	}

	// Генерируем уникальное имя файла
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filepath := filepath.Join(uploadDir, filename)

	// Создаем файл
	out, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	// Копируем содержимое загруженного файла
	_, err = io.Copy(out, file)
	if err != nil {
		return "", err
	}

	// Возвращаем относительный путь к файлу
	return "/static/uploads/" + filename, nil
}

func CreateCar(c *gin.Context) {
	var car models.Car

	// Получаем данные из формы
	car.Brand = c.PostForm("brand")
	car.CarModel = c.PostForm("model")
	car.Year, _ = strconv.Atoi(c.PostForm("year"))
	car.Price, _ = strconv.ParseFloat(c.PostForm("price"), 64)
	car.Mileage, _ = strconv.Atoi(c.PostForm("mileage"))
	car.Color = c.PostForm("color")
	car.EngineSize, _ = strconv.ParseFloat(c.PostForm("engine_size"), 64)
	car.Transmission = c.PostForm("transmission")
	car.FuelType = c.PostForm("fuel_type")
	car.Description = c.PostForm("description")

	// Загрузка изображения, если оно есть
	if imageURL, err := uploadImage(c); err == nil {
		car.ImageURL = imageURL
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

	// Обновляем данные из формы
	car.Brand = c.PostForm("brand")
	car.CarModel = c.PostForm("model")
	car.Year, _ = strconv.Atoi(c.PostForm("year"))
	car.Price, _ = strconv.ParseFloat(c.PostForm("price"), 64)
	car.Mileage, _ = strconv.Atoi(c.PostForm("mileage"))
	car.Color = c.PostForm("color")
	car.EngineSize, _ = strconv.ParseFloat(c.PostForm("engine_size"), 64)
	car.Transmission = c.PostForm("transmission")
	car.FuelType = c.PostForm("fuel_type")
	car.Description = c.PostForm("description")

	// Загрузка изображения, если оно есть
	if imageURL, err := uploadImage(c); err == nil {
		// Удаляем старое изображение, если оно существует
		if car.ImageURL != "" && !strings.HasPrefix(car.ImageURL, "http") {
			oldPath := strings.TrimPrefix(car.ImageURL, "/")
			os.Remove(oldPath)
		}
		car.ImageURL = imageURL
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

func GetUniqueFuelTypes(c *gin.Context) {
	var fuelTypes []string
	if err := config.DB.Model(&models.Car{}).Distinct().Pluck("fuel_type", &fuelTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, fuelTypes)
}

func GetUniqueTransmissions(c *gin.Context) {
	var transmissions []string
	if err := config.DB.Model(&models.Car{}).Distinct().Pluck("transmission", &transmissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, transmissions)
}
