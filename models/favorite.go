package models

import (
	"gorm.io/gorm"
)

type Favorite struct {
	gorm.Model
	CarID uint `json:"car_id" gorm:"uniqueIndex:idx_car_user"`
	Car   Car  `json:"car" gorm:"foreignKey:CarID"`
}
