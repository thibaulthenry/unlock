package models

import "unlock/constants"

type Motion struct {
	Direction constants.SpriteDirection `json:"direction"`
	Jumping   bool                      `json:"jumping"`
	Walking   bool                      `json:"walking"`
}