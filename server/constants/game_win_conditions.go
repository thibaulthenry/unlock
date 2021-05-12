package constants

type GameWinCondition int

const (
	GameWinConditionFirst GameWinCondition = iota
	GameWinConditionTimeout
)