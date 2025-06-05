package main

import (
	"cars_catalog/api"
	"cars_catalog/config"
	"cars_catalog/handlers"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitDB()

	// Очистка базы данных перед парсингом
	if err := config.DB.Exec("DELETE FROM cars").Error; err != nil {
		log.Fatalf("Failed to clear database: %v", err)
	}
	log.Println("Database cleared before parsing")

	if true {
		if err := api.ImportVehiclesToDB(); err != nil {
			log.Printf("Error importing vehicles: %v", err)
		} else {
			log.Println("Successfully imported vehicles")
		}
	}

	r := gin.Default()

	r.Static("/static", "./static")
	r.LoadHTMLGlob("static/*.html")

	r.GET("/", func(c *gin.Context) {
		c.File("static/index.html")
	})

	apiGroup := r.Group("/api")
	{
		apiGroup.GET("/cars", handlers.GetCars)
		apiGroup.GET("/cars/:id", handlers.GetCar)
		apiGroup.POST("/cars", handlers.CreateCar)
		apiGroup.PUT("/cars/:id", handlers.UpdateCar)
		apiGroup.DELETE("/cars/:id", handlers.DeleteCar)
	}

	apiGroup.POST("/import", func(c *gin.Context) {
		if err := api.ImportVehiclesToDB(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Vehicles imported successfully"})
	})

	apiGroup.POST("/clear", handlers.ClearDB)

	r.Run(":8080")
}
