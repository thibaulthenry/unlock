package constants

type TimeoutType int

const (
	TimeoutTypeGameStart TimeoutType = iota
	TimeoutTypeGameWait
	TimeoutTypeLobbyCollapse
	TimeoutTypeLobbyStart
	TimeoutTypeLobbyStartImminent
)

var TimeoutTypes = [...]TimeoutType{
	TimeoutTypeGameStart,
	TimeoutTypeGameWait,
	TimeoutTypeLobbyCollapse,
	TimeoutTypeLobbyStart,
	TimeoutTypeLobbyStartImminent,
}