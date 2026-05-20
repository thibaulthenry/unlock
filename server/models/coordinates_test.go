package models

import (
	"testing"
)

func TestCoordinatesInitialization(t *testing.T) {
	coord := Coordinates{
		X:  10.5,
		Y:  20.3,
		Vx: 1.2,
		Vy: 2.1,
		Ax: 0.1,
		Ay: 0.2,
		R:  45.0,
	}

	if coord.X != 10.5 {
		t.Errorf("Expected X to be 10.5, got %f", coord.X)
	}
	if coord.Y != 20.3 {
		t.Errorf("Expected Y to be 20.3, got %f", coord.Y)
	}
	if coord.Vx != 1.2 {
		t.Errorf("Expected Vx to be 1.2, got %f", coord.Vx)
	}
	if coord.Vy != 2.1 {
		t.Errorf("Expected Vy to be 2.1, got %f", coord.Vy)
	}
	if coord.Ax != 0.1 {
		t.Errorf("Expected Ax to be 0.1, got %f", coord.Ax)
	}
	if coord.Ay != 0.2 {
		t.Errorf("Expected Ay to be 0.2, got %f", coord.Ay)
	}
	if coord.R != 45.0 {
		t.Errorf("Expected R to be 45.0, got %f", coord.R)
	}
}

func TestCoordinatesZeroValues(t *testing.T) {
	coord := Coordinates{}

	if coord.X != 0 {
		t.Errorf("Expected X to be 0, got %f", coord.X)
	}
	if coord.Y != 0 {
		t.Errorf("Expected Y to be 0, got %f", coord.Y)
	}
}
