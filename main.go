package main

import (
	"cars_catalog/config"
	"cars_catalog/handlers"

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
	api := r.Group("/api")
	{
		cars := api.Group("/cars")
		{
			cars.GET("", handlers.GetCars)
			cars.GET("/:id", handlers.GetCar)
			cars.POST("", handlers.CreateCar)
			cars.PUT("/:id", handlers.UpdateCar)
			cars.DELETE("/:id", handlers.DeleteCar)
		}
	}

	// Запуск сервера
	r.Run(":8080")
}
