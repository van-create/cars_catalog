package main

import (
	"cars_catalog/api"
	"cars_catalog/config"
	"cars_catalog/handlers"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Инициализация базы данных
	config.InitDB()

	// Создание роутера
	r := gin.Default()

	// Обслуживание статических файлов
	r.Static("/static", "./static")
	r.LoadHTMLGlob("static/*.html")

	// Главная страница
	r.GET("/", func(c *gin.Context) {
		c.File("static/index.html")
	})

	// Маршруты API
	apiGroup := r.Group("/api")
	{
		cars := apiGroup.Group("/cars")
		{
			cars.GET("", handlers.GetCars)
			cars.GET("/:id", handlers.GetCar)
			cars.POST("", handlers.CreateCar)
			cars.PUT("/:id", handlers.UpdateCar)
			cars.DELETE("/:id", handlers.DeleteCar)
		}

		// Новый маршрут для импорта автомобилей
		apiGroup.POST("/import", func(c *gin.Context) {
			if err := api.ImportVehiclesToDB(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Import completed successfully"})
		})
	}

	// Запуск сервера
	r.Run(":8080")
}
