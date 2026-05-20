package models

import (
	"testing"
)

func TestMotionInitialization(t *testing.T) {
	motion := Motion{
		Direction: "RIGHT",
		Jumping:   true,
		Walking:   false,
	}

	if motion.Direction != "RIGHT" {
		t.Errorf("Expected Direction to be RIGHT, got %s", motion.Direction)
	}
	if !motion.Jumping {
		t.Errorf("Expected Jumping to be true, got %v", motion.Jumping)
	}
	if motion.Walking {
		t.Errorf("Expected Walking to be false, got %v", motion.Walking)
	}
}

func TestMotionDefaults(t *testing.T) {
	motion := Motion{}

	if motion.Jumping {
		t.Errorf("Expected Jumping to be false, got %v", motion.Jumping)
	}
	if motion.Walking {
		t.Errorf("Expected Walking to be false, got %v", motion.Walking)
	}
	if motion.Direction != "" {
		t.Errorf("Expected Direction to be empty, got %s", motion.Direction)
	}
}
